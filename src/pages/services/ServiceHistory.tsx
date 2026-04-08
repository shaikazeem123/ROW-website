import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import {
    Clock,
    MapPin,
    Stethoscope,
    Search,
    RefreshCw,
    Download,
    Users,
    ShieldCheck,
    History as HistoryIcon,
    Edit,
    Trash2,
    Loader2,
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import ExcelJS from 'exceljs';
import type { ServiceEntry } from '@/types/serviceEntry';

interface ExtendedServiceRecord extends ServiceEntry {
    beneficiary?: {
        name: string;
    };
}

export function ServiceHistoryPage() {
    const [services, setServices] = useState<ExtendedServiceRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    const navigate = useNavigate();
    const { role } = usePermissions();
    const isAdmin = role === 'Admin';
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const fetchHistory = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data: entries, error: entriesError } = await supabase
                .from('service_entries')
                .select('*')
                .order('schedule_date', { ascending: false });

            if (entriesError) throw entriesError;

            if (!entries || entries.length === 0) {
                setServices([]);
                return;
            }

            const fileNumbers = Array.from(new Set(entries.map(e => e.file_number))).filter(Boolean);

            const bMap = new Map<string, string>();
            if (fileNumbers.length > 0) {
                const { data: beneficiaries, error: bError } = await supabase
                    .from('beneficiaries')
                    .select('name, file_number')
                    .in('file_number', fileNumbers);

                if (!bError && beneficiaries) {
                    beneficiaries.forEach(b => {
                        if (b.file_number) bMap.set(b.file_number, b.name);
                    });
                }
            }

            const mappedData: ExtendedServiceRecord[] = entries.map(item => ({
                ...item,
                beneficiary: {
                    name: bMap.get(item.file_number) || 'Beneficiary Not Found'
                }
            }));

            setServices(mappedData);
        } catch (error) {
            console.error('Error fetching service history:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const filteredServices = services.filter(s => {
        const matchesSearch =
            (s.beneficiary?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.file_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.service_code || '').toLowerCase().includes(searchTerm.toLowerCase());

        const serviceDate = (s.schedule_date || '').slice(0, 10);
        const matchesFrom = !fromDate || serviceDate >= fromDate;
        const matchesTo = !toDate || serviceDate <= toDate;

        return matchesSearch && matchesFrom && matchesTo;
    });

    const uniqueBeneficiaryCount = new Set(filteredServices.map(s => s.file_number)).size;

    const handleExport = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Service History');

        worksheet.columns = [
            { header: 'Service ID', key: 'id', width: 36 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'File Number', key: 'file_number', width: 15 },
            { header: 'Beneficiary Name', key: 'beneficiary_name', width: 25 },
            { header: 'Schedule Date', key: 'schedule_date', width: 15 },
            { header: 'Start Date', key: 'start_date', width: 15 },
            { header: 'End Date', key: 'end_date', width: 15 },
            { header: 'Location Code', key: 'location_code', width: 15 },
            { header: 'Service Code', key: 'service_code', width: 15 },
            { header: 'Provider', key: 'service_provider_code', width: 20 },
            { header: 'Recommendation', key: 'recommendation', width: 30 },
            { header: 'Contribution', key: 'contribution', width: 12 },
            { header: 'Balance', key: 'balance', width: 12 },
            { header: 'Total', key: 'total', width: 12 },
            { header: 'Outcome', key: 'outcome', width: 15 },
            { header: 'Outcome Desc', key: 'outcome_description', width: 30 },
            { header: 'Receipt No', key: 'receipt_no', width: 15 },
            { header: 'Total Hours', key: 'total_hours', width: 12 },
            { header: 'Mode of Service', key: 'mode_of_service', width: 15 },
            { header: 'Created At', key: 'created_at', width: 20 },
            { header: 'Remarks', key: 'remarks', width: 30 }
        ];

        filteredServices.forEach(s => {
            worksheet.addRow({
                ...s,
                beneficiary_name: s.beneficiary?.name || 'N/A'
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        const rangeLabel = fromDate || toDate
            ? `_${fromDate || 'start'}_to_${toDate || 'end'}`
            : '';
        anchor.download = `Service_History_Audit${rangeLabel}_${new Date().toISOString().split('T')[0]}.xlsx`;
        anchor.click();
        window.URL.revokeObjectURL(url);
    };

    const handleDelete = async (service: ExtendedServiceRecord) => {
        const name = service.beneficiary?.name || service.file_number;
        const date = new Date(service.schedule_date).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
        if (!confirm(`Delete service entry for "${name}" on ${date}?\n\nService: ${service.service_code}\nThis action cannot be undone.`)) return;

        setDeletingId(service.id);
        try {
            const { error } = await supabase
                .from('service_entries')
                .delete()
                .eq('id', service.id);

            if (error) throw error;
            setServices(prev => prev.filter(s => s.id !== service.id));
        } catch (err) {
            console.error('Delete service error:', err);
            alert('Failed to delete service entry. Please try again.');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-text-main flex items-center gap-2">
                        <HistoryIcon className="text-primary" /> Service History Audit
                    </h1>
                    <p className="text-text-muted text-sm mt-1">Review and audit all 21 fields of service entry records.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="secondary" onClick={fetchHistory} className="bg-white">
                        <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                    </Button>
                    <Button onClick={handleExport} className="flex items-center gap-2 shadow-lg shadow-primary/20">
                        <Download size={18} /> <span className="hidden sm:inline">Export Audit Excel</span>
                    </Button>
                </div>
            </div>

            <Card className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <Input
                            placeholder="Search by Beneficiary, File Number or Service..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
                            <ShieldCheck size={16} className="text-blue-500" />
                            <span className="text-xs font-bold text-gray-500 uppercase">Filters:</span>
                        </div>
                        <Input
                            type="date"
                            className="w-40"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                        />
                        <span className="text-gray-400">to</span>
                        <Input
                            type="date"
                            className="w-40"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                        />
                        {(searchTerm || fromDate || toDate) && (
                            <button
                                onClick={() => { setSearchTerm(''); setFromDate(''); setToDate(''); }}
                                className="text-xs font-bold text-primary hover:underline px-2"
                            >
                                Clear All
                            </button>
                        )}
                    </div>
                </div>

                {!isLoading && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-gray-100 shadow-sm min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 bg-primary/10 rounded-xl shrink-0">
                                    <Stethoscope size={18} className="text-primary" />
                                </div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-tight min-w-0 break-words">Total Services</p>
                            </div>
                            <h3 className="text-2xl font-black text-primary">{filteredServices.length}</h3>
                        </div>

                        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-gray-100 shadow-sm min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 bg-blue-100 rounded-xl shrink-0">
                                    <Users size={18} className="text-blue-600" />
                                </div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-tight min-w-0 break-words">Beneficiaries</p>
                            </div>
                            <h3 className="text-2xl font-black text-blue-700">{uniqueBeneficiaryCount}</h3>
                        </div>

                        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-gray-100 shadow-sm min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 bg-green-100 rounded-xl shrink-0">
                                    <Clock size={18} className="text-green-600" />
                                </div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-tight min-w-0 break-words">Total Hours</p>
                            </div>
                            <h3 className="text-2xl font-black text-green-700">
                                {filteredServices.reduce((sum, s) => sum + (s.total_hours || 0), 0).toFixed(1)}
                            </h3>
                        </div>

                        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-gray-100 shadow-sm min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 bg-purple-100 rounded-xl shrink-0">
                                    <MapPin size={18} className="text-purple-600" />
                                </div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-tight min-w-0 break-words">Locations</p>
                            </div>
                            <h3 className="text-2xl font-black text-purple-700">
                                {new Set(filteredServices.map(s => s.location_code)).size}
                            </h3>
                        </div>
                    </div>
                )}

                {isLoading ? (
                    <div className="py-24 flex flex-col items-center justify-center">
                        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
                        <p className="text-text-muted font-medium">Synchronizing service records...</p>
                    </div>
                ) : filteredServices.length === 0 ? (
                    <div className="py-24 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Clock size={32} className="text-gray-200" />
                        </div>
                        <p className="text-gray-400 font-medium">No service records found for the selected criteria.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto min-w-0 w-full">
                        <table className="w-full min-w-[860px] text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="py-4 font-bold text-[10px] uppercase text-gray-400 tracking-wider pl-4">Schedule Date</th>
                                    <th className="py-4 font-bold text-[10px] uppercase text-gray-400 tracking-wider">Beneficiary (File No)</th>
                                    <th className="py-4 font-bold text-[10px] uppercase text-gray-400 tracking-wider">Status</th>
                                    <th className="py-4 font-bold text-[10px] uppercase text-gray-400 tracking-wider">Service & Hours</th>
                                    <th className="py-4 font-bold text-[10px] uppercase text-gray-400 tracking-wider">Location & Mode</th>
                                    {isAdmin && <th className="py-4 font-bold text-[10px] uppercase text-gray-400 tracking-wider pr-4 text-right">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredServices.map((service) => (
                                    <tr key={service.id} className="hover:bg-gray-50/50 transition-colors group align-top">
                                        <td className="py-5 pl-4">
                                            <div className="text-sm font-bold text-gray-900 leading-tight">
                                                {new Date(service.schedule_date).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </div>
                                            <div className="text-[10px] text-gray-400 mt-0.5">
                                                Start: {new Date(service.start_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                            </div>
                                        </td>
                                        <td className="py-5">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors">
                                                    {service.beneficiary?.name || 'In-Process...'}
                                                </span>
                                                <span className="text-[11px] font-black text-blue-600 tracking-tight">
                                                    #{service.file_number}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-5">
                                            <span className={`inline-block whitespace-nowrap px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${service.status === 'AVAILED'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                {service.status}
                                            </span>
                                        </td>
                                        <td className="py-5">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-1.5 text-sm font-bold text-gray-700 uppercase">
                                                    <Stethoscope size={14} className="text-primary" /> {service.service_code}
                                                </div>
                                                <div className="text-[10px] text-gray-400 font-medium flex items-center gap-1 mt-0.5">
                                                    <Clock size={10} /> {service.total_hours} Hours Spent
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-5">
                                            <div className="flex flex-col">
                                                <div className="text-xs font-bold text-gray-700 flex items-center gap-1.5 uppercase">
                                                    <MapPin size={12} className="text-gray-400" /> {service.location_code}
                                                </div>
                                                <div className="text-[10px] text-primary/60 font-bold bg-primary/5 px-1.5 py-0.5 rounded w-fit mt-1">
                                                    {service.mode_of_service}
                                                </div>
                                            </div>
                                        </td>
                                        {isAdmin && (
                                            <td className="py-5 pr-4 text-right">
                                                <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                                                    <Button
                                                        variant="secondary"
                                                        className="h-8 px-2 flex items-center gap-1.5 text-[11px] bg-blue-50 text-blue-600 border-none hover:bg-blue-100"
                                                        onClick={() => navigate(`/services/edit/${service.id}`)}
                                                    >
                                                        <Edit size={14} /> Edit
                                                    </Button>
                                                    <Button
                                                        variant="secondary"
                                                        className="h-8 px-2 flex items-center gap-1.5 text-[11px] bg-red-50 text-red-600 border-none hover:bg-red-100"
                                                        onClick={() => handleDelete(service)}
                                                        disabled={deletingId === service.id}
                                                    >
                                                        {deletingId === service.id
                                                            ? <Loader2 size={14} className="animate-spin" />
                                                            : <Trash2 size={14} />}
                                                        Delete
                                                    </Button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
}
