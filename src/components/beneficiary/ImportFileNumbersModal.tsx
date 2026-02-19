import { useState } from 'react';
import { X, Upload, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { importFileNumbers, type ImportSummary } from '@/services/importService';
import { downloadSampleImportFile } from '@/utils/beneficiaryExport';

interface ImportFileNumbersModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function ImportFileNumbersModal({ isOpen, onClose, onSuccess }: ImportFileNumbersModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [summary, setSummary] = useState<ImportSummary | null>(null);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
            setSummary(null);
        }
    };

    const handleImport = async () => {
        if (!file) return;

        setIsImporting(true);
        setError(null);
        try {
            const result = await importFileNumbers(file);
            setSummary(result);
            if (result.updated > 0) {
                onSuccess();
            }
        } catch (err) {
            const error = err as Error;
            setError(error.message || 'Import failed. Please check the file format.');
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <Card className="w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-xl font-bold text-gray-800">Import File Numbers</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-6">
                    {!summary ? (
                        <div className="space-y-6">
                            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3 text-sm text-blue-700">
                                <Info size={20} className="shrink-0" />
                                <div>
                                    <p className="font-bold mb-1 text-blue-800">Upload Requirements:</p>
                                    <ul className="list-disc list-inside space-y-1">
                                        <li>File format: <strong>.xlsx (Excel)</strong></li>
                                        <li>Required Columns: <strong>SYSTEM_ID</strong>, <strong>FILE_NUMBER</strong></li>
                                        <li>SYSTEM_ID must match the exported ID or Offline Token.</li>
                                    </ul>
                                </div>
                            </div>

                            <div
                                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-color ${file ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary'}`}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    if (e.dataTransfer.files?.[0]) {
                                        setFile(e.dataTransfer.files[0]);
                                    }
                                }}
                            >
                                <Upload size={48} className={`mb-4 ${file ? 'text-primary' : 'text-gray-400'}`} />
                                <p className="text-sm font-medium text-gray-700 text-center">
                                    {file ? file.name : 'Click to upload or drag and drop Excel file'}
                                </p>
                                <p className="text-xs text-text-muted mt-1">.xlsx files supported</p>
                                <input
                                    type="file"
                                    className="hidden"
                                    id="excel-upload"
                                    accept=".xlsx"
                                    onChange={handleFileChange}
                                />
                                <Button
                                    variant="outline"
                                    className="mt-4"
                                    onClick={() => document.getElementById('excel-upload')?.click()}
                                >
                                    Select File
                                </Button>
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-100 p-3 rounded-lg flex gap-2 text-sm text-red-600 animate-in slide-in-from-top-2">
                                    <AlertCircle size={18} className="shrink-0" />
                                    {error}
                                </div>
                            )}

                            <div className="flex justify-between items-center pt-2">
                                <button
                                    onClick={(e) => { e.preventDefault(); downloadSampleImportFile(); }}
                                    className="text-xs font-bold text-primary hover:underline"
                                >
                                    Download Sample Format
                                </button>
                                <div className="flex gap-3">
                                    <Button variant="outline" onClick={onClose} disabled={isImporting}>
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleImport}
                                        disabled={!file || isImporting}
                                        className="px-8"
                                    >
                                        {isImporting ? 'Importing...' : 'Start Import'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle size={32} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Import Complete</h3>
                                <p className="text-sm text-text-muted">The file has been processed successfully.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Total Records</p>
                                    <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
                                </div>
                                <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                                    <p className="text-xs font-medium text-green-700 uppercase tracking-wider">Successfully Updated</p>
                                    <p className="text-2xl font-bold text-green-900">{summary.updated}</p>
                                </div>
                                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                                    <p className="text-xs font-medium text-yellow-700 uppercase tracking-wider">Not Matched</p>
                                    <p className="text-2xl font-bold text-yellow-900">{summary.notMatched}</p>
                                </div>
                                <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                                    <p className="text-xs font-medium text-red-700 uppercase tracking-wider">Errors / Duplicates</p>
                                    <p className="text-2xl font-bold text-red-900">{summary.errors + summary.duplicatesInFile}</p>
                                </div>
                            </div>

                            <Button className="w-full py-6 text-lg" onClick={onClose}>
                                Close
                            </Button>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
