import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Upload, FileUp, AlertCircle, CheckCircle, Download } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { useAuth } from '@/context/AuthContext';



export function ScheduleUpload() {
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { user } = useAuth();

    const processFile = async (file: File) => {
        setUploading(true);
        setMessage(null);

        try {
            let data: any[] = [];

            if (file.name.endsWith('.csv')) {
                // Parse CSV
                Papa.parse(file, {
                    header: true,
                    skipEmptyLines: true,
                    complete: async (results) => {
                        await uploadData(results.data);
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
                    const workbook = XLSX.read(binaryStr, { type: 'binary' });
                    const sheetName = workbook.SheetNames[0];
                    const sheet = workbook.Sheets[sheetName];
                    data = XLSX.utils.sheet_to_json(sheet);
                    await uploadData(data);
                };
                reader.readAsBinaryString(file);
            } else {
                throw new Error('Invalid file type. Please upload a CSV or Excel file.');
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
            setUploading(false);
        }
    };

    const uploadData = async (rawData: any[]) => {
        try {
            // 1. Validate Structure
            if (rawData.length === 0) throw new Error("File is empty.");

            // Normalize keys to lowercase to be safe
            const normalizedData: any[] = rawData.map(row => {
                const newRow: any = {};
                Object.keys(row).forEach(key => {
                    newRow[key.toLowerCase().trim().replace(/ /g, '_')] = row[key];
                });
                return newRow;
            });

            // Check for required columns
            const requiredCols = ['location_name', 'scheduled_date'];
            const firstRow = normalizedData[0];
            const missingCols = requiredCols.filter(col => !Object.keys(firstRow).includes(col));

            if (missingCols.length > 0) {
                throw new Error(`Missing columns: ${missingCols.join(', ')}`);
            }

            // Helper function to parse various date formats
            const parseDate = (dateStr: any): Date => {
                // Handle Excel serial numbers
                if (typeof dateStr === 'number') {
                    // Excel date serial number (days since 1900-01-01)
                    const excelEpoch = new Date(1900, 0, 1);
                    const date = new Date(excelEpoch.getTime() + (dateStr - 2) * 24 * 60 * 60 * 1000);
                    return date;
                }

                const str = String(dateStr).trim();

                // Try DD-MM-YYYY format (most common in your case)
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
                    return new Date(str);
                }

                // Try MM-DD-YYYY format
                if (str.match(/^\d{2}-\d{2}-\d{4}$/)) {
                    const parts = str.split('-').map(Number);
                    // Could be DD-MM-YYYY or MM-DD-YYYY, assume DD-MM-YYYY first
                    if (parts[1] > 12) {
                        // Must be DD-MM-YYYY
                        return new Date(parts[2], parts[1] - 1, parts[0]);
                    }
                    return new Date(parts[2], parts[0] - 1, parts[1]);
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
            } catch (err: any) {
                throw new Error(`Invalid date format in first row: ${err.message}`);
            }

            if (isNaN(firstDate.getTime())) {
                throw new Error(`Invalid date value in first row: ${normalizedData[0].scheduled_date}`);
            }

            const month = firstDate.getMonth() + 1; // 1-12
            const year = firstDate.getFullYear();

            // 3. Validation: Unique Locations
            const uniqueLocations = new Set(normalizedData.map(row => row.location_name));
            if (uniqueLocations.size !== 4) {
                // We will warn but allow, or enforce strictness based on requirements.
                // Requirement says: "Monthly Location Management... operates in only four locations per month."
                // Let's enforce strictness for now, or at least check.
                if (uniqueLocations.size !== 4) {
                    throw new Error(`Schedule must contain exactly 4 unique locations. Found: ${uniqueLocations.size}`);
                }
            }

            // 4. Transform Data for DB
            const dbRows = normalizedData.map((row, index) => {
                let parsedDate: Date;
                try {
                    parsedDate = parseDate(row.scheduled_date);
                } catch (err: any) {
                    throw new Error(`Invalid date in row ${index + 1}: ${err.message}`);
                }

                if (isNaN(parsedDate.getTime())) {
                    throw new Error(`Invalid date value in row ${index + 1}: ${row.scheduled_date}`);
                }

                return {
                    month,
                    year,
                    location_name: row.location_name,
                    scheduled_date: parsedDate.toISOString().split('T')[0], // YYYY-MM-DD format
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

        } catch (error: any) {
            console.error(error);
            setMessage({ type: 'error', text: error.message || "Upload failed." });
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const downloadTemplate = () => {
        // Create sample data for the template
        const sampleData = [
            {
                'Scheduled Date': '2026-02-10',
                'Location Name': 'Chanrayapatna',
                'Address': 'Chanrayapatna, Hassan District, Karnataka'
            },
            {
                'Scheduled Date': '2026-02-15',
                'Location Name': 'Hesarghatta',
                'Address': 'Hesarghatta, Bangalore Rural, Karnataka'
            },
            {
                'Scheduled Date': '2026-02-20',
                'Location Name': 'Nalur',
                'Address': 'Nalur, Bangalore, Karnataka'
            },
            {
                'Scheduled Date': '2026-02-25',
                'Location Name': 'Sonnenahalli',
                'Address': 'Sonnenahalli, Bangalore, Karnataka'
            }
        ];

        // Convert to CSV
        const csv = Papa.unparse(sampleData);

        // Create blob and download
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', 'monthly_schedule_template.csv');
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
                    <li>Required Columns: <strong>Date, Location Name, Address</strong></li>
                    <li>Format: Must contain exactly <strong>4 unique locations</strong> for the designated month.</li>
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
                    Download CSV Template
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
