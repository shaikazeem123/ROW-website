import { useState, useRef } from 'react';
import ExcelJS from 'exceljs';
import { Button } from '@/components/common/Button';
import { Upload, X, CheckCircle2, AlertCircle, Loader2, Info } from 'lucide-react';
import { updateBeneficiaryFileNumber } from '@/services/beneficiaryService';

interface ImportSummary {
    total: number;
    updated: number;
    notMatched: number;
    errors: number;
    duplicates: number;
}

export function FileNumberImport({ onComplete }: { onComplete: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [summary, setSummary] = useState<ImportSummary | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);
        setError(null);
        setSummary(null);

        try {
            const workbook = new ExcelJS.Workbook();
            const arrayBuffer = await file.arrayBuffer();
            await workbook.xlsx.load(arrayBuffer);
            const worksheet = workbook.getWorksheet(1);

            if (!worksheet) throw new Error('Excel file is empty or invalid');

            // Find required columns
            const headerRow = worksheet.getRow(1);
            let systemIdCol = -1;
            let fileNumberCol = -1;

            headerRow.eachCell((cell, colNumber) => {
                const value = cell.value?.toString().toUpperCase();
                if (value === 'SYSTEM_ID') systemIdCol = colNumber;
                if (value === 'FILE_NUMBER' || value === 'FILE NO') fileNumberCol = colNumber;
            });

            if (systemIdCol === -1 || fileNumberCol === -1) {
                throw new Error('Required columns "SYSTEM_ID" or "FILE_NUMBER" not found');
            }

            const stats: ImportSummary = { total: 0, updated: 0, notMatched: 0, errors: 0, duplicates: 0 };
            const seenFileNumbers = new Set<string>();
            const rowsToProcess: { systemId: string, fileNumber: string }[] = [];

            // Skip header row
            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return;
                
                const systemId = row.getCell(systemIdCol).value?.toString()?.trim();
                const fileNumber = row.getCell(fileNumberCol).value?.toString()?.trim();

                if (!systemId || !fileNumber) return;

                stats.total++;

                if (seenFileNumbers.has(fileNumber)) {
                    stats.duplicates++;
                    return;
                }
                seenFileNumbers.add(fileNumber);
                rowsToProcess.push({ systemId, fileNumber });
            });

            // Process updates
            for (const row of rowsToProcess) {
                const result = await updateBeneficiaryFileNumber(row.systemId, row.fileNumber);
                if (result.success) {
                    stats.updated++;
                } else if (result.error === 'Not Matched') {
                    stats.notMatched++;
                } else {
                    stats.errors++;
                }
            }

            setSummary(stats);
            if (onComplete) onComplete();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to process file');
        } finally {
            setIsProcessing(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <>
            <Button 
                variant="secondary" 
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100"
            >
                <Upload size={18} /> Import File Numbers
            </Button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-300">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-900">Import File Numbers</h3>
                                <button onClick={() => { setIsOpen(false); setSummary(null); setError(null); }} className="text-gray-400 hover:text-gray-600">
                                    <X size={24} />
                                </button>
                            </div>

                            {error && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-700">
                                    <AlertCircle size={20} className="shrink-0" />
                                    <p className="text-sm font-medium">{error}</p>
                                </div>
                            )}

                            {!summary && !isProcessing && (
                                <div className="space-y-4">
                                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3 text-blue-700">
                                        <Info size={20} className="shrink-0" />
                                        <div className="text-sm">
                                            <p className="font-semibold mb-1">Upload Instructions:</p>
                                            <ul className="list-disc list-inside space-y-1 opacity-90">
                                                <li>Excel must have <b>SYSTEM_ID</b> column</li>
                                                <li>Excel must have <b>FILE_NUMBER</b> column</li>
                                                <li>Duplicate file numbers will be skipped</li>
                                            </ul>
                                        </div>
                                    </div>
                                    <input
                                        type="file"
                                        accept=".xlsx, .xls"
                                        className="hidden"
                                        ref={fileInputRef}
                                        onChange={handleFileSelect}
                                    />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full py-8 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center gap-3 hover:border-blue-400 hover:bg-blue-50/50 transition-all group"
                                    >
                                        <div className="p-4 bg-gray-50 rounded-full text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-500 transition-colors">
                                            <Upload size={32} />
                                        </div>
                                        <span className="text-sm font-medium text-gray-600">Click to upload Excel file</span>
                                    </button>
                                </div>
                            )}

                            {isProcessing && (
                                <div className="py-12 flex flex-col items-center gap-4">
                                    <Loader2 size={48} className="text-blue-500 animate-spin" />
                                    <p className="text-gray-600 font-medium">Processing records, please wait...</p>
                                </div>
                            )}

                            {summary && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-4 bg-gray-50 rounded-xl text-center">
                                            <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Rows</p>
                                        </div>
                                        <div className="p-4 bg-green-50 rounded-xl text-center border border-green-100">
                                            <p className="text-2xl font-bold text-green-600">{summary.updated}</p>
                                            <p className="text-xs font-semibold text-green-700 uppercase tracking-wider">Updated</p>
                                        </div>
                                        <div className="p-4 bg-orange-50 rounded-xl text-center border border-orange-100">
                                            <p className="text-2xl font-bold text-orange-600">{summary.notMatched}</p>
                                            <p className="text-xs font-semibold text-orange-700 uppercase tracking-wider">Not Matched</p>
                                        </div>
                                        <div className="p-4 bg-red-50 rounded-xl text-center border border-red-100">
                                            <p className="text-2xl font-bold text-red-600">{summary.errors + summary.duplicates}</p>
                                            <p className="text-xs font-semibold text-red-700 uppercase tracking-wider">Issues</p>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-green-50 border border-green-100 rounded-xl flex items-center gap-3 text-green-700">
                                        <CheckCircle2 size={24} className="shrink-0" />
                                        <p className="font-semibold">Import Completed!</p>
                                    </div>

                                    <Button onClick={() => { setIsOpen(false); setSummary(null); }} className="w-full">
                                        Close Summary
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
