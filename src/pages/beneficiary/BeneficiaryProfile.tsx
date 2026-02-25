import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import {
    User,
    MapPin,
    Phone,
    Calendar,
    ArrowLeft,
    Activity,
    Plus,
    Clock,
    Stethoscope
} from 'lucide-react';
import type { OfflineBeneficiary } from '@/lib/db';

interface Service {
    id: string;
    service_type: string;
    service_date: string;
    provider_name?: string;
    venue?: string;
    notes?: string;
    fee_charged?: number;
}

export function BeneficiaryProfilePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [beneficiary, setBeneficiary] = useState<OfflineBeneficiary | null>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            // Fetch beneficiary details
            const { data: bData, error: bError } = await supabase
                .from('beneficiaries')
                .select('*')
                .eq('id', id)
                .single();

            if (bError) throw bError;
            setBeneficiary(bData);

            // Fetch service history from service_entries using file_number
            if (bData.file_number) {
                const { data: sData, error: sError } = await supabase
                    .from('service_entries')
                    .select('*')
                    .eq('file_number', bData.file_number)
                    .order('schedule_date', { ascending: false });

                if (sError) throw sError;

                // Map to the Service interface used in this component
                const mappedServices: Service[] = (sData || []).map((s: any) => ({
                    id: s.id,
                    service_type: s.service_code,
                    service_date: s.schedule_date,
                    provider_name: s.service_provider_code,
                    venue: s.location_code,
                    notes: s.remarks,
                    fee_charged: s.total_hours // Just an example, maybe fee is internal now
                }));
                setServices(mappedServices);
            }

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id, fetchData]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!beneficiary) {
        return (
            <div className="text-center py-12">
                <p className="text-text-muted mb-4">Beneficiary not found.</p>
                <Button onClick={() => navigate('/beneficiary/list')}>Back to List</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/beneficiary/list')}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-text-muted"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-text-main">{beneficiary.name}</h1>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-text-muted mt-1">
                            <span className="flex items-center gap-1">Token: <b className="text-primary">#{beneficiary.token_no || 'N/A'}</b></span>
                            <span>•</span>
                            <span className="flex items-center gap-1">ID: <b className="text-gray-700">{beneficiary.id?.slice(0, 8) || 'N/A'}</b></span>
                            <span>•</span>
                            <span className={`px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider border ${beneficiary.file_number ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                                {beneficiary.file_number ? `File No: ${beneficiary.file_number}` : 'File No: Not Assigned'}
                            </span>
                            <span>•</span>
                            <span>Registered on {new Date(beneficiary.date_of_registration).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Link to={`/beneficiary/edit/${id}`}>
                        <Button variant="outline" className="flex items-center gap-2">
                            Edit Profile
                        </Button>
                    </Link>
                    <Link to={`/services/new?beneficiary_id=${id}`}>
                        <Button className="flex items-center gap-2">
                            <Plus size={18} /> New Service
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Core Info */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Basic Info */}
                    <Card className="p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <User size={20} />
                            </div>
                            <h2 className="font-semibold text-text-main">Personal Details</h2>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs text-text-muted uppercase font-bold tracking-wider">Age & Gender</p>
                                <p className="text-text-main font-medium">{beneficiary.age || 'N/A'} years • {beneficiary.gender || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-text-muted uppercase font-bold tracking-wider">Guardian</p>
                                <p className="text-text-main font-medium">{beneficiary.parent_guardian || 'N/A'} ({beneficiary.relationship || 'N/A'})</p>
                            </div>
                            <div>
                                <p className="text-xs text-text-muted uppercase font-bold tracking-wider">Mobile Number</p>
                                <p className="text-text-main font-medium flex items-center gap-2">
                                    <Phone size={14} className="text-primary" />
                                    {beneficiary.mobile_no || 'No contact'}
                                </p>
                            </div>
                            {beneficiary.token_no && (
                                <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                                    <p className="text-[10px] text-primary uppercase font-bold tracking-widest ">Today's Token Number</p>
                                    <p className="text-2xl font-black text-primary">#{beneficiary.token_no}</p>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Address Info */}
                    <Card className="p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                                <MapPin size={20} />
                            </div>
                            <h2 className="font-semibold text-text-main">Address</h2>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs text-text-muted uppercase font-bold tracking-wider">Primary Address</p>
                                <p className="text-text-main font-medium leading-relaxed">{beneficiary.address || 'N/A'}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-text-muted uppercase font-bold tracking-wider">City</p>
                                    <p className="text-text-main font-medium">{beneficiary.city || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-text-muted uppercase font-bold tracking-wider">District</p>
                                    <p className="text-text-main font-medium">{beneficiary.district || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-text-muted uppercase font-bold tracking-wider">State</p>
                                    <p className="text-text-main font-medium">{beneficiary.state || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-text-muted uppercase font-bold tracking-wider">Pincode</p>
                                    <p className="text-text-main font-medium">{beneficiary.pincode || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right Column: Medical & History */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Medical / Program Info */}
                    <Card className="p-6 bg-gradient-to-br from-white to-primary/5">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                                <Activity size={20} />
                            </div>
                            <h2 className="font-semibold text-text-main">Program & Medical Info</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs text-text-muted uppercase font-bold tracking-wider">Disability Type</p>
                                    <div className="mt-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full inline-block text-sm font-semibold">
                                        {beneficiary.disability_type || 'General'}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-text-muted uppercase font-bold tracking-wider">Economic Status</p>
                                    <div className="mt-1 px-3 py-1 bg-green-100 text-green-700 rounded-full inline-block text-sm font-semibold">
                                        {beneficiary.economic_status || 'N/A'}
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs text-text-muted uppercase font-bold tracking-wider">Program / Donor</p>
                                    <p className="text-text-main font-medium">{beneficiary.program} / {beneficiary.donor}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-text-muted uppercase font-bold tracking-wider">Purpose of Visit</p>
                                    <p className="text-text-main font-medium">{beneficiary.purpose_of_visit}</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Service History */}
                    <Card className="p-6 overflow-hidden">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
                                    <Clock size={20} />
                                </div>
                                <h2 className="font-semibold text-text-main">Service History</h2>
                            </div>
                            <span className="text-xs text-text-muted font-medium bg-gray-100 px-2 py-1 rounded">
                                {services.length} Total Services
                            </span>
                        </div>

                        {services.length > 0 ? (
                            <div className="space-y-8 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                                {services.map((service) => (
                                    <div key={service.id} className="relative pl-10">
                                        {/* Dot */}
                                        <div className="absolute left-[13px] top-1.5 w-2 h-2 rounded-full bg-primary border-4 border-white ring-1 ring-primary/20"></div>

                                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 p-4 bg-gray-50 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-100 transition-all">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs text-primary font-bold bg-primary/5 px-2 py-0.5 rounded uppercase tracking-wider">
                                                        {service.service_type}
                                                    </span>
                                                    <span className="text-sm text-text-muted flex items-center gap-1">
                                                        <Calendar size={14} />
                                                        {new Date(service.service_date).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-1 text-sm text-text-main font-medium">
                                                        <Stethoscope size={16} className="text-text-muted" />
                                                        {service.provider_name || 'Anonymous Provider'}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-sm text-text-muted">
                                                        <MapPin size={16} />
                                                        {service.venue || 'On-site'}
                                                    </div>
                                                </div>
                                                {service.notes && (
                                                    <p className="text-sm text-text-muted mt-2 pl-4 border-l-2 border-gray-200 italic">
                                                        &ldquo;{service.notes}&rdquo;
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-bold text-text-main">
                                                    ₹{service.fee_charged?.toLocaleString() || '0'}
                                                </div>
                                                <div className="text-[10px] text-text-muted uppercase font-bold tracking-widest mt-1">
                                                    Paid Status: Success
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <Activity size={48} className="mx-auto text-gray-200 mb-3" />
                                <p className="text-text-muted">No service history recorded yet.</p>
                                <Link to={`/services/new?beneficiary_id=${id}`}>
                                    <Button variant="outline" className="mt-4">
                                        Click here to record first service
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}

