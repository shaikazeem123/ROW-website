import { useState, useEffect, useCallback } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Stethoscope, Calendar, MapPin, ArrowLeft, Save, AlertCircle } from 'lucide-react';

export function ServiceEntryPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const beneficiaryId = searchParams.get('beneficiary_id');

    const [beneficiaryName, setBeneficiaryName] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        serviceDate: new Date().toISOString().split('T')[0],
        serviceType: 'Consultation',
        providerName: '',
        venue: 'Mobile Bus',
        feeCharged: '0',
        notes: '',
        outcome: ''
    });

    const fetchBeneficiaryName = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('beneficiaries')
                .select('name')
                .eq('id', beneficiaryId)
                .single();
            if (error) throw error;
            setBeneficiaryName(data.name);
        } catch (error) {
            console.error('Error fetching beneficiary:', error);
        } finally {
            setIsLoading(false);
        }
    }, [beneficiaryId]);

    useEffect(() => {
        if (beneficiaryId) {
            fetchBeneficiaryName();
        }
    }, [beneficiaryId, fetchBeneficiaryName]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!beneficiaryId) return;

        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('services')
                .insert([{
                    beneficiary_id: beneficiaryId,
                    service_date: formData.serviceDate,
                    service_type: formData.serviceType,
                    provider_name: formData.providerName,
                    venue: formData.venue,
                    fee_charged: parseFloat(formData.feeCharged),
                    notes: formData.notes,
                    outcome: formData.outcome
                }]);

            if (error) throw error;
            navigate(`/beneficiary/${beneficiaryId}`);
        } catch (error) {
            console.error('Error saving service:', error);
            const message = error instanceof Error ? error.message : 'Failed to save service';
            alert(message);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors text-text-muted"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-text-main">New Service Entry</h1>
                    <p className="text-text-muted">Recording service for <span className="text-primary font-bold">{beneficiaryName || 'Beneficiary'}</span></p>
                </div>
            </div>

            {!beneficiaryId && (
                <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-3">
                    <AlertCircle size={20} />
                    <p>No beneficiary selected. Please select a beneficiary from the list first.</p>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <Card className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-text-main flex items-center gap-2">
                                <Calendar size={16} className="text-primary" /> Service Date
                            </label>
                            <input
                                type="date"
                                required
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                value={formData.serviceDate}
                                onChange={(e) => setFormData(prev => ({ ...prev, serviceDate: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-text-main flex items-center gap-2">
                                <Stethoscope size={16} className="text-primary" /> Service Type
                            </label>
                            <select
                                required
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                value={formData.serviceType}
                                onChange={(e) => setFormData(prev => ({ ...prev, serviceType: e.target.value }))}
                            >
                                <option value="Consultation">Consultation</option>
                                <option value="Physiotherapy">Physiotherapy</option>
                                <option value="Occupational Therapy">Occupational Therapy</option>
                                <option value="Speech Therapy">Speech Therapy</option>
                                <option value="Screening">Screening</option>
                                <option value="Follow-up">Follow-up</option>
                                <option value="Medicine Distribution">Medicine Distribution</option>
                                <option value="Diagnostic Test">Diagnostic Test</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-text-main">Provider Name</label>
                            <input
                                type="text"
                                placeholder="Doctor / Therapist Name"
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                value={formData.providerName}
                                onChange={(e) => setFormData(prev => ({ ...prev, providerName: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-text-main flex items-center gap-2">
                                <MapPin size={16} className="text-primary" /> Venue
                            </label>
                            <input
                                type="text"
                                placeholder="Location or Venue"
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                value={formData.venue}
                                onChange={(e) => setFormData(prev => ({ ...prev, venue: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-text-main">Fee Charged (₹)</label>
                            <input
                                type="number"
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                value={formData.feeCharged}
                                onChange={(e) => setFormData(prev => ({ ...prev, feeCharged: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-text-main">Service Notes</label>
                        <textarea
                            rows={3}
                            placeholder="Observations, diagnosis, or treatment details..."
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-text-main text-green-600">Expected Outcome / Result</label>
                        <textarea
                            rows={2}
                            placeholder="Patient response or next steps..."
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            value={formData.outcome}
                            onChange={(e) => setFormData(prev => ({ ...prev, outcome: e.target.value }))}
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate(-1)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex items-center gap-2"
                            disabled={isSaving || !beneficiaryId}
                        >
                            <Save size={18} /> {isSaving ? 'Saving...' : 'Save Service Record'}
                        </Button>
                    </div>
                </Card>
            </form>
        </div>
    );
}
