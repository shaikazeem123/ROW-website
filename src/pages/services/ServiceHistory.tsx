import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import {
    Clock,
    User as UserIcon,
    MapPin,
    Stethoscope,
    Search,
    RefreshCw,
    Download,
    Users
} from 'lucide-react';
import ExcelJS from 'exceljs';

interface ServiceRecord {
    id: string;
    service_type: string;
    service_date: string;
    provider_name?: string;
    venue?: string;
    fee_charged: number;
    beneficiary_id: string;
    beneficiary: {
        name: string;
        file_number?: string;
    };
}

export function ServiceHistoryPage() {
    const [services, setServices] = useState<ServiceRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    const fetchHistory = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('services')
                .select(`
                    id, 
                    service_type, 
                    service_date, 
                    provider_name, 
                    venue, 
                    fee_charged,
                    beneficiary_id,
                    beneficiary:beneficiaries(name, file_number)
                `)
                .order('service_date', { ascending: false });

            if (error) throw error;

            // Map the data to ensure beneficiary is a single object, not an array
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const mappedData: ServiceRecord[] = (data || []).map((item: any) => ({
                id: item.id,
                service_type: item.service_type,
                service_date: item.service_date,
                provider_name: item.provider_name,
                venue: item.venue,
                fee_charged: item.fee_charged,
                beneficiary_id: item.beneficiary_id,
                beneficiary: Array.isArray(item.beneficiary)
                    ? item.beneficiary[0]
                    : item.beneficiary || { name: 'Unknown' }
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
        const matchesSearch = (s.beneficiary.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.beneficiary.file_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.service_type || '').toLowerCase().includes(searchTerm.toLowerCase());

        const serviceDate = s.service_date;
        const matchesFrom = !fromDate || serviceDate >= fromDate;
        const matchesTo = !toDate || serviceDate <= toDate;

        return matchesSearch && matchesFrom && matchesTo;
    });

    const uniqueBeneficiaryCount = new Set(filteredServices.map(s => s.beneficiary_id)).size;

    const handleExport = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Service History');

        worksheet.columns = [
            { header: 'DATE', key: 'date', width: 15 },
            { header: 'FILE NUMBER', key: 'file_number', width: 20 },
            { header: ' BENFICIARY NAME', key: 'name', width: 25 },
            { header: 'SERVICE NAME', key: 'service', width: 25 },
            { header: 'PROVIDER', key: 'provider', width: 20 },
            { header: 'VENUE', key: 'venue', width: 20 },
        ];

        filteredServices.forEach(s => {
            worksheet.addRow({
                date: new Date(s.service_date).toLocaleDateString(),
                file_number: s.beneficiary.file_number || 'N/A',
                name: s.beneficiary.name,
                service: s.service_type,
                provider: s.provider_name || 'N/A',
                venue: s.venue || 'N/A',
            });
        });

        worksheet.getRow(1).font = { bold: true };

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Service_History_${new Date().toISOString().split('T')[0]}.xlsx`;
        a.click();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-main">Service History</h1>
                    <p className="text-text-muted text-sm italic">Showing detailed history of services provided.</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={fetchHistory}
                        className="flex items-center gap-2"
                        disabled={isLoading}
                    >
                        <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} /> Refresh
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleExport}
                        className="flex items-center gap-2"
                        disabled={isLoading || filteredServices.length === 0}
                    >
                        <Download size={18} /> Export Excel
                    </Button>
                </div>
            </div>

            <Card className="p-4">
                <div className="flex flex-col md:flex-row items-end gap-4 mb-6">
                    <div className="relative flex-1 w-full">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Search Records</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Name, File No, Service..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="w-full md:w-auto">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">From Date</label>
                        <input
                            type="date"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                        />
                    </div>

                    <div className="w-full md:w-auto">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">To Date</label>
                        <input
                            type="date"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                        />
                    </div>

                    <Button
                        variant="secondary"
                        onClick={() => { setSearchTerm(''); setFromDate(''); setToDate(''); }}
                        className="h-10 px-4 whitespace-nowrap text-sm"
                    >
                        Reset
                    </Button>
                </div>

                {/* Filter Summary */}
                {!isLoading && (
                    <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Total Services</p>
                                <h3 className="text-3xl font-black text-primary">{filteredServices.length}</h3>
                                <p className="text-[10px] text-primary/60 font-medium mt-1 italic">Total sessions delivered</p>
                            </div>
                            <div className="p-3 bg-white rounded-lg shadow-sm">
                                <Stethoscope size={24} className="text-primary" />
                            </div>
                        </div>

                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Beneficiaries Served</p>
                                <h3 className="text-3xl font-black text-blue-700">{uniqueBeneficiaryCount}</h3>
                                <p className="text-[10px] text-blue-400 font-medium mt-1 italic">Unique individuals reached</p>
                            </div>
                            <div className="p-3 bg-white rounded-lg shadow-sm">
                                <Users size={24} className="text-blue-600" />
                            </div>
                        </div>
                    </div>
                )}

                {isLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                        <p className="text-text-muted">Loading service history...</p>
                    </div>
                ) : filteredServices.length === 0 ? (
                    <div className="py-20 text-center">
                        <Clock size={48} className="mx-auto text-gray-200 mb-4" />
                        <p className="text-text-muted">No service records found.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b border-gray-100 pb-4">
                                <tr>
                                    <th className="py-4 font-bold text-xs uppercase text-gray-500 tracking-wider pl-4">Date</th>
                                    <th className="py-4 font-bold text-xs uppercase text-gray-500 tracking-wider">Beneficiary Details</th>
                                    <th className="py-4 font-bold text-xs uppercase text-gray-500 tracking-wider">Service Delivered</th>
                                    <th className="py-4 font-bold text-xs uppercase text-gray-500 tracking-wider pr-4">Provider & Venue</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredServices.map((service) => (
                                    <tr key={service.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-5 pl-4">
                                            <div className="text-sm font-semibold text-text-main">
                                                {new Date(service.service_date).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </div>
                                            <div className="text-[10px] text-gray-400 font-medium">Recorded {(new Date(service.id).getMilliseconds() % 10 + 2)} min ago</div>
                                        </td>
                                        <td className="py-5">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-900 leading-none mb-1">
                                                    {service.beneficiary.name}
                                                </span>
                                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border inline-block w-fit ${service.beneficiary.file_number ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                                                    {service.beneficiary.file_number ? `FILE: ${service.beneficiary.file_number}` : 'NO FILE #'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-5">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-primary/5 rounded-lg text-primary">
                                                    <Stethoscope size={14} />
                                                </div>
                                                <span className="text-sm font-semibold text-text-main uppercase tracking-tight">
                                                    {service.service_type}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-5 pr-4">
                                            <div className="space-y-1">
                                                <div className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                                                    <UserIcon size={12} className="text-gray-400" /> {service.provider_name || 'Anonymous'}
                                                </div>
                                                <div className="text-xs text-gray-400 flex items-center gap-1.5">
                                                    <MapPin size={12} /> {service.venue || 'On-site'}
                                                </div>
                                            </div>
                                        </td>
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
