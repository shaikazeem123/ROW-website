import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Plus, User, MapPin, Phone, Search, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { exportBeneficiariesToCSV } from '@/utils/beneficiaryExport';

export function BeneficiaryListPage() {
    const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchBeneficiaries();
    }, []);

    const fetchBeneficiaries = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('beneficiaries')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            setBeneficiaries(data || []);
        } catch (error) {
            console.error('Error fetching beneficiaries:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExport = () => {
        exportBeneficiariesToCSV(filteredBeneficiaries);
    };

    const filteredBeneficiaries = beneficiaries.filter(b =>
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.mobile_no?.includes(searchTerm)
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-main">Registered Beneficiaries</h1>
                    <p className="text-text-muted">Manage and view all patient profiles.</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={handleExport}
                        className="flex items-center gap-2"
                        disabled={isLoading || filteredBeneficiaries.length === 0}
                    >
                        <Download size={18} /> Export Report
                    </Button>
                    <Link to="/beneficiary/add">
                        <Button className="flex items-center gap-2">
                            <Plus size={18} /> Add Beneficiary
                        </Button>
                    </Link>
                </div>
            </div>

            <Card className="p-4">
                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                    <input
                        type="text"
                        placeholder="Search by name or mobile number..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : filteredBeneficiaries.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredBeneficiaries.map((b) => (
                            <Link key={b.id} to={`/beneficiary/${b.id}`}>
                                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-primary">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-primary/10 rounded-full text-primary">
                                            <User size={24} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-text-main truncate">{b.name}</h3>
                                            <p className="text-sm text-text-muted">{b.age} years • {b.gender}</p>
                                            <div className="mt-3 space-y-1">
                                                <p className="text-xs text-text-muted flex items-center gap-2">
                                                    <MapPin size={14} /> {b.city || b.district || 'No address'}
                                                </p>
                                                <p className="text-xs text-text-muted flex items-center gap-2">
                                                    <Phone size={14} /> {b.mobile_no || 'No phone'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-text-muted">
                        <User size={48} className="mx-auto mb-4 opacity-20" />
                        <p>No beneficiaries found.</p>
                    </div>
                )}
            </Card>
        </div>
    );
}
