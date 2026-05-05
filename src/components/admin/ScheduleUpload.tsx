import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Upload, FileUp, AlertCircle, CheckCircle, Download } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { useAuth } from '@/hooks/useAuth';



interface ScheduleRow {
    location_name: string;
    scheduled_date: string;
    address?: string;
}

export function ScheduleUpload() {
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { user } = useAuth();

    const processFile = async (file: File) => {
        setUploading(true);
        setMessage(null);

        try {

            if (file.name.endsWith('.csv')) {
                // Parse CSV
                Papa.parse(file, {
                    header: true,
                    skipEmptyLines: true,
                    complete: async (results) => {
                        await uploadData(results.data as Record<string, unknown>[]);
                    },
                    error: (error) => {
                        throw new Error(`CSV Parse Error: ${error.message}`);
                    }
                });
            } else if (file.name.match(/\.(xlsx|xls)$/)) {
                // Parse Excel
                const reader = new FileReader();
                reader.onload = async (e) => {
                    const binaryStr = e.target?.result;
                    const workbook = XLSX.read(binaryStr, { type: 'binary', cellDates: true });
                    const sheetName = workbook.SheetNames[0];
                    const sheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(sheet, { raw: false, dateNF: 'dd-mm-yyyy' }) as Record<string, unknown>[];
                    await uploadData(jsonData);
                };
                reader.readAsBinaryString(file);
            } else {
                throw new Error('Invalid file type. Please upload a CSV or Excel file.');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            setMessage({ type: 'error', text: errorMessage });
            setUploading(false);
        }
    };

    const uploadData = async (rawData: Record<string, unknown>[]) => {
        try {
            // 1. Validate Structure
            if (rawData.length === 0) throw new Error("File is empty.");

            // Normalize keys to lowercase to be safe
            const normalizedData = rawData.map(row => {
                const newRow: Record<string, unknown> = {};
                Object.keys(row).forEach(key => {
                    const normalizedKey = key.replace(/^\ufeff/, '').toLowerCase().trim().replace(/ /g, '_');
                    newRow[normalizedKey] = row[key];
                });
                return newRow as unknown as ScheduleRow;
            });

            // Check for required columns
            const requiredCols = ['location_name', 'scheduled_date'];
            const firstRow = normalizedData[0];
            const missingCols = requiredCols.filter(col => !Object.keys(firstRow).includes(col));

            if (missingCols.length > 0) {
                throw new Error(`Missing columns: ${missingCols.join(', ')}`);
            }

            // Helper function to parse various date formats
            const parseDate = (dateStr: string | number | Date): Date => {
                // Handle Excel serial numbers
                if (typeof dateStr === 'number') {
                    // Excel date serial number: serial 1 = Jan 1, 1900
                    // Subtract 2 to account for Excel's 1-based index and leap year bug
                    // Use day-based math (not milliseconds) to avoid DST issues
                    return new Date(1900, 0, 1 + (dateStr - 2));
                }

                const str = String(dateStr).trim();

                // DD-MM-YYYY format (day first, as used in Indian date format)
                if (str.match(/^\d{2}-\d{2}-\d{4}$/)) {
                    const [day, month, year] = str.split('-').map(Number);
                    return new Date(year, month - 1, day);
                }

                // Try DD/MM/YYYY format
                if (str.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                    const [day, month, year] = str.split('/').map(Number);
                    return new Date(year, month - 1, day);
                }

                // Try YYYY-MM-DD format (ISO)
                if (str.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    const [year, month, day] = str.split('-').map(Number);
                    return new Date(year, month - 1, day);
                }

                // Fallback: try native Date parser
                const fallbackDate = new Date(str);
                if (!isNaN(fallbackDate.getTime())) {
                    return fallbackDate;
                }

                throw new Error(`Unable to parse date: ${str}`);
            };


            // 2. Extract Month/Year from the first valid date found
            let firstDate: Date;
            try {
                firstDate = parseDate(normalizedData[0].scheduled_date);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                throw new Error(`Invalid date format in first row: ${errorMessage}`);
            }

            if (isNaN(firstDate.getTime())) {
                throw new Error(`Invalid date value in first row: ${normalizedData[0].scheduled_date}`);
            }

            const month = firstDate.getMonth() + 1; // 1-12
            const year = firstDate.getFullYear();

            const uniqueLocations = new Set(normalizedData.map(row => row.location_name));

            // 3. Transform Data for DB
            const dbRows = normalizedData.map((row, index) => {
                let parsedDate: Date;
                try {
                    parsedDate = parseDate(row.scheduled_date);
                } catch (err) {
                    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                    throw new Error(`Invalid date in row ${index + 1}: ${errorMessage}`);
                }

                if (isNaN(parsedDate.getTime())) {
                    throw new Error(`Invalid date value in row ${index + 1}: ${row.scheduled_date}`);
                }

                // Format date as YYYY-MM-DD using local time (not UTC) to avoid timezone shift
                const yyyy = parsedDate.getFullYear();
                const mm = String(parsedDate.getMonth() + 1).padStart(2, '0');
                const dd = String(parsedDate.getDate()).padStart(2, '0');

                return {
                    month,
                    year,
                    location_name: row.location_name,
                    scheduled_date: `${yyyy}-${mm}-${dd}`,
                    address: row.address || null,
                    is_active: true
                };
            });

            // 5. Database Transaction

            // A. Archive previous schedules for this month (if re-uploading)
            const { error: updateError } = await supabase
                .from('monthly_schedules')
                .update({ is_active: false })
                .eq('month', month)
                .eq('year', year);

            if (updateError) throw updateError;

            // B. Insert new records
            const { error: insertError } = await supabase
                .from('monthly_schedules')
                .insert(dbRows);

            if (insertError) throw insertError;

            // Log the upload action
            await supabase.from('audit_logs').insert({
                user_id: user?.id,
                action: 'SCHEDULE_UPLOAD',
                details: {
                    month,
                    year,
                    location_count: dbRows.length,
                    unique_locations: uniqueLocations.size
                }
            });

            setMessage({ type: 'success', text: `Successfully uploaded ${dbRows.length} schedule records for ${new Date(year, month - 1).toLocaleString('default', { month: 'long' })} ${year}.` });

        } catch (error) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : "Upload failed.";
            setMessage({ type: 'error', text: errorMessage });
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const downloadTemplate = () => {
        // Create sample data for the template
        const sampleData = [
            {
                'Scheduled Date': '2026-03-10',
                'Location Name': 'Chanrayapatna',
                'Address': 'Chanrayapatna, Hassan District, Karnataka'
            },
            {
                'Scheduled Date': '2026-03-15',
                'Location Name': 'Hesarghatta',
                'Address': 'Hesarghatta, Bangalore Rural, Karnataka'
            },
            {
                'Scheduled Date': '2026-03-20',
                'Location Name': 'Nalur',
                'Address': 'Nalur, Bangalore, Karnataka'
            },
            {
                'Scheduled Date': '2026-03-25',
                'Location Name': 'Sonnenahalli',
                'Address': 'Sonnenahalli, Bangalore, Karnataka'
            }
        ];

        // Generate Excel file using the XLSX library already imported
        const ws = XLSX.utils.json_to_sheet(sampleData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Schedule Template");

        // Set column widths for better readability
        ws['!cols'] = [
            { wch: 15 }, // Scheduled Date
            { wch: 20 }, // Location Name
            { wch: 40 }  // Address
        ];

        // Trigger download
        XLSX.writeFile(wb, 'monthly_schedule_template.xlsx');
    };

    return (
        <Card className="p-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <FileUp className="text-primary" /> Import Monthly Schedule
            </h3>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="text-sm font-bold text-blue-900 mb-2">Instructions:</h4>
                <ul className="list-disc list-inside text-xs text-blue-800 space-y-1">
                    <li>Upload CSV or Excel (.xlsx) file.</li>
                    <li>Required Columns: <strong>Scheduled Date, Location Name, Address</strong></li>
                    <li>Format: Locations and dates from the Excel will reflect in the Calendar and Upcoming Camps.</li>
                    <li>System will automatically detect the Month/Year from the dates.</li>
                </ul>
            </div>

            <div className="mb-6 flex justify-end">
                <Button
                    onClick={downloadTemplate}
                    variant="outline"
                    className="flex items-center gap-2 text-sm"
                >
                    <Download size={16} />
                    Download Sample Template (.xlsx)
                </Button>
            </div>

            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-10 hover:bg-gray-50 transition-colors">
                <input
                    type="file"
                    ref={fileInputRef}
                    accept=".csv, .xlsx, .xls"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
                    disabled={uploading}
                />

                {uploading ? (
                    <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                        <p className="text-sm text-text-muted">Processing file...</p>
                    </div>
                ) : (
                    <div className="text-center">
                        <Upload className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                        <p className="text-sm text-text-main font-medium mb-1">Click to upload schedule</p>
                        <p className="text-xs text-text-muted">CSV or Excel files only</p>
                        <Button
                            onClick={() => fileInputRef.current?.click()}
                            className="mt-4"
                            variant="outline"
                        >
                            Select File
                        </Button>
                    </div>
                )}
            </div>

            {message && (
                <div className={`mt-4 p-3 rounded-lg flex items-start gap-2 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    {message.type === 'success' ? <CheckCircle size={16} className="mt-0.5" /> : <AlertCircle size={16} className="mt-0.5" />}
                    <span>{message.text}</span>
                </div>
            )}
        </Card>
    );
}
