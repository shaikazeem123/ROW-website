import { useState } from 'react';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Button } from '@/components/common/Button';
import { DROPDOWNS, toOptions } from '@/constants/assessmentDropdowns';
import { getVASCategory } from '@/utils/assessmentLogic';
import type { ClinicalAssessment, InitialAssessment } from '@/types/assessment';
import { assessmentService } from '@/services/assessmentService';
import { Activity, Save, Loader2 } from 'lucide-react';

interface Props {
    initialData: InitialAssessment | null;
    existingClinical: ClinicalAssessment | null;
    onSaved: (saved: ClinicalAssessment) => void;
}

export function ClinicalAssessmentForm({ initialData, existingClinical, onSaved }: Props) {
    if (!initialData) {
        return (
            <Card>
                <p className="text-text-muted text-center py-8">Please complete the Initial Assessment first.</p>
            </Card>
        );
    }
    const condition = initialData.primary_condition;
    const isEdit = !!existingClinical?.id;

    const [data, setData] = useState<Partial<ClinicalAssessment>>(() => {
        if (existingClinical) return { ...existingClinical };
        return {
            patient_id: initialData.patient_id,
            condition,
            side_of_limb_affected: initialData.side_of_limb_affected,
            joint_involved: initialData.joint_involved,
            pulmonary_symptoms: [],
        };
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);

    const set = (field: string, value: string | number | string[] | null) => {
        setData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    };

    const toggleSymptom = (symptom: string) => {
        const current = data.pulmonary_symptoms || [];
        const updated = current.includes(symptom)
            ? current.filter(s => s !== symptom)
            : [...current, symptom];
        set('pulmonary_symptoms', updated);
    };

    const validate = (): boolean => {
        const e: Record<string, string> = {};

        if (condition === 'Pain') {
            if (!data.rom_aaos) e.rom_aaos = 'ROM is required';
            if (!data.strength_mmt) e.strength_mmt = 'Strength is required';
            if (data.vas_pre == null || data.vas_pre < 0 || data.vas_pre > 10) e.vas_pre = 'VAS Pre must be 0–10';
            if (data.vas_post == null || data.vas_post < 0 || data.vas_post > 10) e.vas_post = 'VAS Post must be 0–10';
        }
        if (condition === 'Neuro') {
            if (!data.neuro_strength) e.neuro_strength = 'Strength is required';
            if (!data.neuro_balance) e.neuro_balance = 'Balance is required';
            if (!data.coordination_test) e.coordination_test = 'Coordination test is required';
            if (!data.coordination_severity) e.coordination_severity = 'Severity is required';
        }
        if (condition === 'Pulmonary') {
            if (!data.cough) e.cough = 'Cough is required';
            if (!data.pulmonary_symptoms?.length) e.pulmonary_symptoms = 'Select at least one symptom';
            if (!data.dyspnea_mrmc) e.dyspnea_mrmc = 'Dyspnea is required';
        }
        if (condition === 'Disability') {
            if (!data.disability_type) e.disability_type = 'Disability type is required';
            if (!data.fim_locomotion) e.fim_locomotion = 'FIM Locomotion is required';
            if (!data.fim_mobility) e.fim_mobility = 'FIM Mobility is required';
        }
        if (condition === 'Post-Operative') {
            if (!data.postop_surgery_type) e.postop_surgery_type = 'Surgery type is required';
            if (!data.weight_bearing_status) e.weight_bearing_status = 'Weight bearing status is required';
            if (!data.functional_mobility_level) e.functional_mobility_level = 'Mobility level is required';
        }
        if (condition === 'Amputation') {
            if (!data.amputation_level) e.amputation_level = 'Amputation level is required';
            if (!data.residual_limb_condition) e.residual_limb_condition = 'Residual limb condition is required';
            if (!data.prosthesis_status) e.prosthesis_status = 'Prosthesis status is required';
            if (!data.amp_level) e.amp_level = 'AMP level is required';
        }

        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setIsSaving(true);
        try {
            // Build payload with nulls for non-relevant condition fields
            const payload: Omit<ClinicalAssessment, 'id' | 'created_at'> = {
                patient_id: initialData.patient_id,
                condition,
                side_of_limb_affected: data.side_of_limb_affected || null,
                joint_involved: data.joint_involved || null,
                // Pain
                rom_aaos: condition === 'Pain' ? data.rom_aaos || null : null,
                strength_mmt: condition === 'Pain' ? data.strength_mmt || null : null,
                vas_pre: condition === 'Pain' ? Number(data.vas_pre) : null,
                vas_category_pre: condition === 'Pain' ? getVASCategory(Number(data.vas_pre)) : null,
                vas_post: condition === 'Pain' ? Number(data.vas_post) : null,
                vas_category_post: condition === 'Pain' ? getVASCategory(Number(data.vas_post)) : null,
                // Neuro
                neuro_strength: condition === 'Neuro' ? data.neuro_strength || null : null,
                neuro_balance: condition === 'Neuro' ? data.neuro_balance || null : null,
                coordination_test: condition === 'Neuro' ? data.coordination_test || null : null,
                coordination_severity: condition === 'Neuro' ? data.coordination_severity || null : null,
                // Pulmonary
                cough: condition === 'Pulmonary' ? data.cough || null : null,
                pulmonary_symptoms: condition === 'Pulmonary' ? data.pulmonary_symptoms || null : null,
                dyspnea_mrmc: condition === 'Pulmonary' ? data.dyspnea_mrmc || null : null,
                // Disability
                disability_type: condition === 'Disability' ? data.disability_type || null : null,
                fim_locomotion: condition === 'Disability' ? data.fim_locomotion || null : null,
                fim_mobility: condition === 'Disability' ? data.fim_mobility || null : null,
                // Post-Op
                postop_surgery_type: condition === 'Post-Operative' ? data.postop_surgery_type || null : null,
                weight_bearing_status: condition === 'Post-Operative' ? data.weight_bearing_status || null : null,
                functional_mobility_level: condition === 'Post-Operative' ? data.functional_mobility_level || null : null,
                // Amputation
                amputation_level: condition === 'Amputation' ? data.amputation_level || null : null,
                residual_limb_condition: condition === 'Amputation' ? data.residual_limb_condition || null : null,
                prosthesis_status: condition === 'Amputation' ? data.prosthesis_status || null : null,
                amp_level: condition === 'Amputation' ? data.amp_level || null : null,
            };

            const result = isEdit
                ? await assessmentService.updateClinical(existingClinical!.id!, payload)
                : await assessmentService.createClinical(payload);
            onSaved(result);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to save';
            setErrors({ _form: msg });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {errors._form && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{errors._form}</div>
            )}

            {/* Common Fields */}
            <Card>
                <div className="flex items-center gap-2 mb-5 pb-3 border-b border-gray-100">
                    <Activity size={18} className="text-primary" />
                    <h3 className="font-semibold text-text-main">Clinical Assessment — {condition}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input label="Patient ID" value={initialData.patient_id} disabled />
                    <Input label="Condition" value={condition} disabled />
                    <Select
                        label="Side of Limb Affected"
                        value={data.side_of_limb_affected || ''}
                        onChange={e => set('side_of_limb_affected', e.target.value)}
                        options={toOptions(DROPDOWNS.LimbSide)}
                    />
                    <Select
                        label="Joint Involved"
                        value={data.joint_involved || ''}
                        onChange={e => set('joint_involved', e.target.value)}
                        options={toOptions(DROPDOWNS.Joint)}
                    />
                </div>
            </Card>

            {/* Pain */}
            {condition === 'Pain' && (
                <Card>
                    <h3 className="font-semibold text-text-main mb-4">Pain / Orthopedic Assessment</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                            label="ROM (AAOS)"
                            value={data.rom_aaos || ''}
                            onChange={e => set('rom_aaos', e.target.value)}
                            options={toOptions(DROPDOWNS.ROM)}
                            error={errors.rom_aaos}
                            required
                        />
                        <Select
                            label="Strength (MMT)"
                            value={data.strength_mmt || ''}
                            onChange={e => set('strength_mmt', e.target.value)}
                            options={toOptions(DROPDOWNS.Strength)}
                            error={errors.strength_mmt}
                            required
                        />
                        <Input
                            label="VAS Score (Pre)"
                            type="number"
                            min={0}
                            max={10}
                            value={data.vas_pre ?? ''}
                            onChange={e => set('vas_pre', parseInt(e.target.value) || 0)}
                            error={errors.vas_pre}
                            required
                        />
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-text-main">VAS Category (Pre)</label>
                            <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-text-muted">
                                {data.vas_pre != null ? getVASCategory(Number(data.vas_pre)) : '—'}
                            </div>
                        </div>
                        <Input
                            label="VAS Score (Post)"
                            type="number"
                            min={0}
                            max={10}
                            value={data.vas_post ?? ''}
                            onChange={e => set('vas_post', parseInt(e.target.value) || 0)}
                            error={errors.vas_post}
                            required
                        />
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-text-main">VAS Category (Post)</label>
                            <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-text-muted">
                                {data.vas_post != null ? getVASCategory(Number(data.vas_post)) : '—'}
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {/* Neuro */}
            {condition === 'Neuro' && (
                <Card>
                    <h3 className="font-semibold text-text-main mb-4">Neuro Assessment</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                            label="Neuro Strength"
                            value={data.neuro_strength || ''}
                            onChange={e => set('neuro_strength', e.target.value)}
                            options={toOptions(DROPDOWNS.Strength)}
                            error={errors.neuro_strength}
                            required
                        />
                        <Select
                            label="Balance"
                            value={data.neuro_balance || ''}
                            onChange={e => set('neuro_balance', e.target.value)}
                            options={toOptions(DROPDOWNS.Balance)}
                            error={errors.neuro_balance}
                            required
                        />
                        <Select
                            label="Coordination Test"
                            value={data.coordination_test || ''}
                            onChange={e => set('coordination_test', e.target.value)}
                            options={toOptions(DROPDOWNS.CoordinationTests)}
                            error={errors.coordination_test}
                            required
                        />
                        <Select
                            label="Coordination Severity"
                            value={data.coordination_severity || ''}
                            onChange={e => set('coordination_severity', e.target.value)}
                            options={toOptions(DROPDOWNS.CoordinationSeverity)}
                            error={errors.coordination_severity}
                            required
                        />
                    </div>
                </Card>
            )}

            {/* Pulmonary */}
            {condition === 'Pulmonary' && (
                <Card>
                    <h3 className="font-semibold text-text-main mb-4">Pulmonary Assessment</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                            label="Cough"
                            value={data.cough || ''}
                            onChange={e => set('cough', e.target.value)}
                            options={toOptions(DROPDOWNS.Cough)}
                            error={errors.cough}
                            required
                        />
                        <Select
                            label="Dyspnea (mMRC)"
                            value={data.dyspnea_mrmc || ''}
                            onChange={e => set('dyspnea_mrmc', e.target.value)}
                            options={toOptions(DROPDOWNS.Dyspnea)}
                            error={errors.dyspnea_mrmc}
                            required
                        />
                        <div className="md:col-span-2">
                            <label className="text-sm font-medium text-text-main block mb-2">Pulmonary Symptoms</label>
                            <div className="flex flex-wrap gap-2">
                                {DROPDOWNS.PulmonarySymptoms.map(symptom => {
                                    const selected = (data.pulmonary_symptoms || []).includes(symptom);
                                    return (
                                        <button
                                            key={symptom}
                                            type="button"
                                            onClick={() => toggleSymptom(symptom)}
                                            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                                                selected
                                                    ? 'bg-primary text-white border-primary'
                                                    : 'bg-white text-text-main border-gray-300 hover:border-primary'
                                            }`}
                                        >
                                            {symptom}
                                        </button>
                                    );
                                })}
                            </div>
                            {errors.pulmonary_symptoms && (
                                <span className="text-xs text-red-500 mt-1 block">{errors.pulmonary_symptoms}</span>
                            )}
                        </div>
                    </div>
                </Card>
            )}

            {/* Disability */}
            {condition === 'Disability' && (
                <Card>
                    <h3 className="font-semibold text-text-main mb-4">Disability Assessment</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                            label="Disability Type"
                            value={data.disability_type || ''}
                            onChange={e => set('disability_type', e.target.value)}
                            options={toOptions(DROPDOWNS.DisabilityType)}
                            error={errors.disability_type}
                            required
                        />
                        <Select
                            label="FIM Locomotion"
                            value={data.fim_locomotion || ''}
                            onChange={e => set('fim_locomotion', e.target.value)}
                            options={toOptions(DROPDOWNS.FIM)}
                            error={errors.fim_locomotion}
                            required
                        />
                        <Select
                            label="FIM Mobility (Transfers)"
                            value={data.fim_mobility || ''}
                            onChange={e => set('fim_mobility', e.target.value)}
                            options={toOptions(DROPDOWNS.FIM)}
                            error={errors.fim_mobility}
                            required
                        />
                    </div>
                </Card>
            )}

            {/* Post-Operative */}
            {condition === 'Post-Operative' && (
                <Card>
                    <h3 className="font-semibold text-text-main mb-4">Post-Operative Assessment</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                            label="Surgery Type"
                            value={data.postop_surgery_type || ''}
                            onChange={e => set('postop_surgery_type', e.target.value)}
                            options={toOptions(DROPDOWNS.SurgeryType)}
                            error={errors.postop_surgery_type}
                            required
                        />
                        <Select
                            label="Weight Bearing Status"
                            value={data.weight_bearing_status || ''}
                            onChange={e => set('weight_bearing_status', e.target.value)}
                            options={toOptions(DROPDOWNS.WeightBearing)}
                            error={errors.weight_bearing_status}
                            required
                        />
                        <Select
                            label="Functional Mobility Level"
                            value={data.functional_mobility_level || ''}
                            onChange={e => set('functional_mobility_level', e.target.value)}
                            options={toOptions(DROPDOWNS.Mobility)}
                            error={errors.functional_mobility_level}
                            required
                        />
                    </div>
                </Card>
            )}

            {/* Amputation */}
            {condition === 'Amputation' && (
                <Card>
                    <h3 className="font-semibold text-text-main mb-4">Amputation Assessment</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                            label="Amputation Level"
                            value={data.amputation_level || ''}
                            onChange={e => set('amputation_level', e.target.value)}
                            options={toOptions(DROPDOWNS.AmputationLevel)}
                            error={errors.amputation_level}
                            required
                        />
                        <Select
                            label="Residual Limb Condition"
                            value={data.residual_limb_condition || ''}
                            onChange={e => set('residual_limb_condition', e.target.value)}
                            options={toOptions(DROPDOWNS.ResidualLimb)}
                            error={errors.residual_limb_condition}
                            required
                        />
                        <Select
                            label="Prosthesis Status"
                            value={data.prosthesis_status || ''}
                            onChange={e => set('prosthesis_status', e.target.value)}
                            options={toOptions(DROPDOWNS.Prosthesis)}
                            error={errors.prosthesis_status}
                            required
                        />
                        <Select
                            label="AMP Level (K-Level)"
                            value={data.amp_level || ''}
                            onChange={e => set('amp_level', e.target.value)}
                            options={toOptions(DROPDOWNS.AMP)}
                            error={errors.amp_level}
                            required
                        />
                    </div>
                </Card>
            )}

            {/* Submit */}
            <div className="flex justify-end">
                <Button onClick={handleSubmit} disabled={isSaving}>
                    {isSaving ? <Loader2 size={16} className="animate-spin mr-2 inline" /> : <Save size={16} className="mr-2 inline" />}
                    {isEdit ? 'Update & Continue' : 'Save & Continue'}
                </Button>
            </div>
        </div>
    );
}
