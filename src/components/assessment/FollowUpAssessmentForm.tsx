import { useState, useEffect } from 'react';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Button } from '@/components/common/Button';
import { Loader } from '@/components/common/Loader';
import { DROPDOWNS, toOptions } from '@/constants/assessmentDropdowns';
import type { InitialAssessment, FollowUpAssessment } from '@/types/assessment';
import { assessmentService } from '@/services/assessmentService';
import { Calendar, ClipboardList, Plus, Save, Loader2, Edit, X, Baby } from 'lucide-react';

const EI_DOMAINS = [
    { key: 'head_control', label: 'Head Control', statusKey: 'EI_HeadControl_Status' as keyof typeof DROPDOWNS, goalKey: 'EI_HeadControl_Goal' as keyof typeof DROPDOWNS },
    { key: 'rolling', label: 'Rolling', statusKey: 'EI_Rolling_Status' as keyof typeof DROPDOWNS, goalKey: 'EI_Rolling_Goal' as keyof typeof DROPDOWNS },
    { key: 'sitting', label: 'Sitting', statusKey: 'EI_Sitting_Status' as keyof typeof DROPDOWNS, goalKey: 'EI_Sitting_Goal' as keyof typeof DROPDOWNS },
    { key: 'crawling', label: 'Crawling', statusKey: 'EI_Crawling_Status' as keyof typeof DROPDOWNS, goalKey: 'EI_Crawling_Goal' as keyof typeof DROPDOWNS },
    { key: 'standing', label: 'Standing', statusKey: 'EI_Standing_Status' as keyof typeof DROPDOWNS, goalKey: 'EI_Standing_Goal' as keyof typeof DROPDOWNS },
    { key: 'walking', label: 'Walking', statusKey: 'EI_Walking_Status' as keyof typeof DROPDOWNS, goalKey: 'EI_Walking_Goal' as keyof typeof DROPDOWNS },
    { key: 'hand_function', label: 'Hand Function', statusKey: 'EI_HandFunction_Status' as keyof typeof DROPDOWNS, goalKey: 'EI_HandFunction_Goal' as keyof typeof DROPDOWNS },
    { key: 'communication', label: 'Communication', statusKey: 'EI_Communication_Status' as keyof typeof DROPDOWNS, goalKey: 'EI_Communication_Goal' as keyof typeof DROPDOWNS },
    { key: 'social', label: 'Social', statusKey: 'EI_Social_Status' as keyof typeof DROPDOWNS, goalKey: 'EI_Social_Goal' as keyof typeof DROPDOWNS },
] as const;

interface Props {
    initialData: InitialAssessment | null;
}

export function FollowUpAssessmentForm({ initialData }: Props) {
    const condition = initialData?.primary_condition ?? '';
    const isEI = condition === 'Early Intervention Assessment';
    const patientId = initialData?.patient_id ?? '';

    const [history, setHistory] = useState<FollowUpAssessment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingSession, setEditingSession] = useState<FollowUpAssessment | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const nextSession = history.length + 1;
    const today = new Date().toISOString().split('T')[0];

    const latestVasCurrent = (() => {
        if (condition !== 'Pain') return null;
        for (let i = history.length - 1; i >= 0; i--) {
            if (history[i].vas_current != null) return history[i].vas_current;
        }
        return null;
    })();

    const newForm = (): Partial<FollowUpAssessment> => ({
        patient_id: patientId,
        visit_date: today,
        session_number: nextSession,
        condition,
        side_of_limb_affected: initialData?.side_of_limb_affected,
        joint_involved: initialData?.joint_involved,
        vas_previous: latestVasCurrent,
    });

    const [data, setData] = useState<Partial<FollowUpAssessment>>(newForm());

    const isEditMode = !!editingSession;

    useEffect(() => {
        if (initialData) loadHistory();
        else setIsLoading(false);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const loadHistory = async () => {
        setIsLoading(true);
        const records = await assessmentService.getFollowUps(patientId);
        setHistory(records);
        setIsLoading(false);
    };

    useEffect(() => {
        if (!editingSession) setData(newForm());
    }, [history.length]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!initialData) {
        return (
            <Card>
                <p className="text-text-muted text-center py-8">Please complete the Initial Assessment first.</p>
            </Card>
        );
    }

    const set = (field: string, value: string | number | null) => {
        setData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    };

    const openEdit = (row: FollowUpAssessment) => {
        setEditingSession(row);
        setData({ ...row });
        setShowForm(true);
        setErrors({});
    };

    const openNew = () => {
        setEditingSession(null);
        setData(newForm());
        setShowForm(true);
        setErrors({});
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingSession(null);
        setErrors({});
    };

    const validate = (): boolean => {
        const e: Record<string, string> = {};
        if (!data.visit_date) e.visit_date = 'Visit date is required';
        if (!isEI) {
            if (!data.side_of_limb_affected) e.side_of_limb_affected = 'Side of limb is required';
            if (!data.joint_involved) e.joint_involved = 'Joint is required';
        }

        if (condition === 'Pain') {
            if (!data.rom) e.rom = 'ROM is required';
            if (!data.strength) e.strength = 'Strength is required';
            if (data.vas_current == null || data.vas_current < 0 || data.vas_current > 10) e.vas_current = 'VAS must be 0–10';
        }
        if (condition === 'Neuro') {
            if (!data.neuro_strength) e.neuro_strength = 'Strength is required';
            if (!data.balance) e.balance = 'Balance is required';
            if (!data.coordination_test) e.coordination_test = 'Coordination test is required';
            if (!data.coordination_severity) e.coordination_severity = 'Severity is required';
        }
        if (condition === 'Pulmonary') {
            if (!data.dyspnea_mrmc) e.dyspnea_mrmc = 'Dyspnea is required';
        }
        if (condition === 'Disability') {
            if (!data.fim_locomotion) e.fim_locomotion = 'FIM Locomotion is required';
            if (!data.fim_mobility) e.fim_mobility = 'FIM Mobility is required';
        }
        if (condition === 'Amputation') {
            if (!data.amp_level) e.amp_level = 'AMP level is required';
        }
        if (isEI) {
            for (const domain of EI_DOMAINS) {
                const statusField = `ei_${domain.key}_status`;
                if (!data[statusField as keyof typeof data]) e[statusField] = `${domain.label} status is required`;
            }
            if (!data.ei_service_level) e.ei_service_level = 'Service level is required';
            if (!data.ei_outcome) e.ei_outcome = 'Outcome is required';
            if (!data.ei_assessor_name?.trim()) e.ei_assessor_name = 'Assessor name is required';
        }

        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const buildPayload = (): Omit<FollowUpAssessment, 'id' | 'created_at'> => ({
        patient_id: patientId,
        visit_date: data.visit_date!,
        session_number: isEditMode ? editingSession!.session_number : nextSession,
        condition,
        side_of_limb_affected: data.side_of_limb_affected || null,
        joint_involved: data.joint_involved || null,
        rom: condition === 'Pain' ? data.rom || null : null,
        strength: condition === 'Pain' ? data.strength || null : null,
        vas_previous: condition === 'Pain' ? (data.vas_previous ?? null) : null,
        vas_current: condition === 'Pain' ? Number(data.vas_current) : null,
        neuro_strength: condition === 'Neuro' ? data.neuro_strength || null : null,
        balance: condition === 'Neuro' ? data.balance || null : null,
        coordination_test: condition === 'Neuro' ? data.coordination_test || null : null,
        coordination_severity: condition === 'Neuro' ? data.coordination_severity || null : null,
        dyspnea_mrmc: condition === 'Pulmonary' ? data.dyspnea_mrmc || null : null,
        fim_locomotion: condition === 'Disability' ? data.fim_locomotion || null : null,
        fim_mobility: condition === 'Disability' ? data.fim_mobility || null : null,
        amp_level: condition === 'Amputation' ? data.amp_level || null : null,
        // Early Intervention
        ei_head_control_status: isEI ? data.ei_head_control_status || null : null,
        ei_head_control_goal: isEI ? data.ei_head_control_goal || null : null,
        ei_rolling_status: isEI ? data.ei_rolling_status || null : null,
        ei_rolling_goal: isEI ? data.ei_rolling_goal || null : null,
        ei_sitting_status: isEI ? data.ei_sitting_status || null : null,
        ei_sitting_goal: isEI ? data.ei_sitting_goal || null : null,
        ei_crawling_status: isEI ? data.ei_crawling_status || null : null,
        ei_crawling_goal: isEI ? data.ei_crawling_goal || null : null,
        ei_standing_status: isEI ? data.ei_standing_status || null : null,
        ei_standing_goal: isEI ? data.ei_standing_goal || null : null,
        ei_walking_status: isEI ? data.ei_walking_status || null : null,
        ei_walking_goal: isEI ? data.ei_walking_goal || null : null,
        ei_hand_function_status: isEI ? data.ei_hand_function_status || null : null,
        ei_hand_function_goal: isEI ? data.ei_hand_function_goal || null : null,
        ei_communication_status: isEI ? data.ei_communication_status || null : null,
        ei_communication_goal: isEI ? data.ei_communication_goal || null : null,
        ei_social_status: isEI ? data.ei_social_status || null : null,
        ei_social_goal: isEI ? data.ei_social_goal || null : null,
        ei_service_level: isEI ? data.ei_service_level || null : null,
        ei_outcome: isEI ? data.ei_outcome || null : null,
        ei_assessor_name: isEI ? data.ei_assessor_name || null : null,
        ei_remarks: isEI ? data.ei_remarks || null : null,
    });

    const handleSubmit = async () => {
        if (!validate()) return;
        setIsSaving(true);
        try {
            const payload = buildPayload();
            if (isEditMode) {
                await assessmentService.updateFollowUp(editingSession!.id!, payload);
            } else {
                await assessmentService.createFollowUp(payload);
            }
            closeForm();
            await loadHistory();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message
                : (err && typeof err === 'object' && 'message' in err) ? String((err as { message: string }).message)
                : 'Failed to save';
            setErrors({ _form: msg });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <Loader />;

    return (
        <div className="space-y-6">
            {errors._form && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{errors._form}</div>
            )}

            {/* Session History */}
            <Card>
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <Calendar size={18} className="text-primary" />
                        <h3 className="font-semibold text-text-main">Session History</h3>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                            {history.length} session{history.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                    {!showForm && (
                        <Button onClick={openNew} className="text-sm">
                            <Plus size={16} className="mr-1 inline" /> Follow-Up Session
                        </Button>
                    )}
                </div>

                {history.length === 0 ? (
                    <p className="text-sm text-text-muted text-center py-6">No follow-up sessions yet</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="text-left py-2 px-3 font-medium text-text-muted">#</th>
                                    <th className="text-left py-2 px-3 font-medium text-text-muted">Date</th>
                                    {!isEI && (
                                        <>
                                            <th className="text-left py-2 px-3 font-medium text-text-muted">Side</th>
                                            <th className="text-left py-2 px-3 font-medium text-text-muted">Joint</th>
                                        </>
                                    )}
                                    {condition === 'Pain' && (
                                        <>
                                            <th className="text-left py-2 px-3 font-medium text-text-muted">ROM</th>
                                            <th className="text-left py-2 px-3 font-medium text-text-muted">Strength</th>
                                            <th className="text-left py-2 px-3 font-medium text-text-muted">VAS Prev</th>
                                            <th className="text-left py-2 px-3 font-medium text-text-muted">VAS Curr</th>
                                        </>
                                    )}
                                    {condition === 'Neuro' && (
                                        <>
                                            <th className="text-left py-2 px-3 font-medium text-text-muted">Strength</th>
                                            <th className="text-left py-2 px-3 font-medium text-text-muted">Balance</th>
                                            <th className="text-left py-2 px-3 font-medium text-text-muted">Coord. Test</th>
                                            <th className="text-left py-2 px-3 font-medium text-text-muted">Severity</th>
                                        </>
                                    )}
                                    {condition === 'Pulmonary' && (
                                        <th className="text-left py-2 px-3 font-medium text-text-muted">Dyspnea (mMRC)</th>
                                    )}
                                    {condition === 'Disability' && (
                                        <>
                                            <th className="text-left py-2 px-3 font-medium text-text-muted">FIM Locomotion</th>
                                            <th className="text-left py-2 px-3 font-medium text-text-muted">FIM Mobility</th>
                                        </>
                                    )}
                                    {condition === 'Amputation' && (
                                        <th className="text-left py-2 px-3 font-medium text-text-muted">AMP Level</th>
                                    )}
                                    {isEI && (
                                        <>
                                            <th className="text-left py-2 px-3 font-medium text-text-muted">Service Level</th>
                                            <th className="text-left py-2 px-3 font-medium text-text-muted">Outcome</th>
                                            <th className="text-left py-2 px-3 font-medium text-text-muted">Assessor</th>
                                        </>
                                    )}
                                    <th className="text-right py-2 px-3 font-medium text-text-muted">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map(row => (
                                    <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                                        <td className="py-2 px-3 font-medium">{row.session_number}</td>
                                        <td className="py-2 px-3">{row.visit_date}</td>
                                        {!isEI && (
                                            <>
                                                <td className="py-2 px-3">{row.side_of_limb_affected || '—'}</td>
                                                <td className="py-2 px-3">{row.joint_involved || '—'}</td>
                                            </>
                                        )}
                                        {condition === 'Pain' && (
                                            <>
                                                <td className="py-2 px-3">{row.rom || '—'}</td>
                                                <td className="py-2 px-3">{row.strength || '—'}</td>
                                                <td className="py-2 px-3">{row.vas_previous ?? '—'}</td>
                                                <td className="py-2 px-3">{row.vas_current ?? '—'}</td>
                                            </>
                                        )}
                                        {condition === 'Neuro' && (
                                            <>
                                                <td className="py-2 px-3">{row.neuro_strength || '—'}</td>
                                                <td className="py-2 px-3">{row.balance || '—'}</td>
                                                <td className="py-2 px-3">{row.coordination_test || '—'}</td>
                                                <td className="py-2 px-3">{row.coordination_severity || '—'}</td>
                                            </>
                                        )}
                                        {condition === 'Pulmonary' && (
                                            <td className="py-2 px-3">{row.dyspnea_mrmc || '—'}</td>
                                        )}
                                        {condition === 'Disability' && (
                                            <>
                                                <td className="py-2 px-3">{row.fim_locomotion || '—'}</td>
                                                <td className="py-2 px-3">{row.fim_mobility || '—'}</td>
                                            </>
                                        )}
                                        {condition === 'Amputation' && (
                                            <td className="py-2 px-3">{row.amp_level || '—'}</td>
                                        )}
                                        {isEI && (
                                            <>
                                                <td className="py-2 px-3">{row.ei_service_level || '—'}</td>
                                                <td className="py-2 px-3">{row.ei_outcome || '—'}</td>
                                                <td className="py-2 px-3">{row.ei_assessor_name || '—'}</td>
                                            </>
                                        )}
                                        <td className="py-2 px-3 text-right">
                                            <button
                                                onClick={() => openEdit(row)}
                                                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                                            >
                                                <Edit size={12} /> Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Follow-Up Session Form (New or Edit) */}
            {showForm && (
                <>
                    <Card>
                        <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <ClipboardList size={18} className="text-primary" />
                                <h3 className="font-semibold text-text-main">
                                    {isEditMode
                                        ? `Edit Follow-Up Session — #${editingSession!.session_number}`
                                        : `Follow-Up Session — #${nextSession}`}
                                </h3>
                            </div>
                            <button onClick={closeForm} className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input label="Patient ID" value={patientId} disabled />
                            <Input
                                label="Visit Date"
                                type="date"
                                value={data.visit_date || today}
                                onChange={e => set('visit_date', e.target.value)}
                                error={errors.visit_date}
                                required
                            />
                            <Input label="Session No." value={String(isEditMode ? editingSession!.session_number : nextSession)} disabled />
                            <Input label="Condition" value={condition} disabled />
                            {!isEI && (
                                <>
                                    <Select
                                        label="Side of Limb"
                                        value={data.side_of_limb_affected || ''}
                                        onChange={e => set('side_of_limb_affected', e.target.value)}
                                        options={toOptions(DROPDOWNS.LimbSide)}
                                        error={errors.side_of_limb_affected}
                                        required
                                    />
                                    <Select
                                        label="Joint"
                                        value={data.joint_involved || ''}
                                        onChange={e => set('joint_involved', e.target.value)}
                                        options={toOptions(DROPDOWNS.Joint)}
                                        error={errors.joint_involved}
                                        required
                                    />
                                </>
                            )}
                        </div>
                    </Card>

                    {/* Condition-specific progress fields */}
                    {condition === 'Pain' && (
                        <Card>
                            <h3 className="font-semibold text-text-main mb-4">Progress — Pain</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Select
                                    label="ROM"
                                    value={data.rom || ''}
                                    onChange={e => set('rom', e.target.value)}
                                    options={toOptions(DROPDOWNS.ROM)}
                                    error={errors.rom}
                                    required
                                />
                                <Select
                                    label="Strength (MMT)"
                                    value={data.strength || ''}
                                    onChange={e => set('strength', e.target.value)}
                                    options={toOptions(DROPDOWNS.Strength)}
                                    error={errors.strength}
                                    required
                                />
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-text-main">VAS Previous</label>
                                    <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-text-muted">
                                        {data.vas_previous ?? (isEditMode ? '—' : 'N/A (first session)')}
                                    </div>
                                </div>
                                <Input
                                    label="VAS Current"
                                    type="number"
                                    min={0}
                                    max={10}
                                    value={data.vas_current ?? ''}
                                    onChange={e => set('vas_current', parseInt(e.target.value) || 0)}
                                    error={errors.vas_current}
                                    required
                                />
                            </div>
                        </Card>
                    )}

                    {condition === 'Neuro' && (
                        <Card>
                            <h3 className="font-semibold text-text-main mb-4">Progress — Neuro</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Select
                                    label="Strength"
                                    value={data.neuro_strength || ''}
                                    onChange={e => set('neuro_strength', e.target.value)}
                                    options={toOptions(DROPDOWNS.Strength)}
                                    error={errors.neuro_strength}
                                    required
                                />
                                <Select
                                    label="Balance"
                                    value={data.balance || ''}
                                    onChange={e => set('balance', e.target.value)}
                                    options={toOptions(DROPDOWNS.Balance)}
                                    error={errors.balance}
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

                    {condition === 'Pulmonary' && (
                        <Card>
                            <h3 className="font-semibold text-text-main mb-4">Progress — Pulmonary</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Select
                                    label="Dyspnea (mMRC)"
                                    value={data.dyspnea_mrmc || ''}
                                    onChange={e => set('dyspnea_mrmc', e.target.value)}
                                    options={toOptions(DROPDOWNS.Dyspnea)}
                                    error={errors.dyspnea_mrmc}
                                    required
                                />
                            </div>
                        </Card>
                    )}

                    {condition === 'Disability' && (
                        <Card>
                            <h3 className="font-semibold text-text-main mb-4">Progress — Disability</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                    {condition === 'Amputation' && (
                        <Card>
                            <h3 className="font-semibold text-text-main mb-4">Progress — Amputation</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                    {/* Early Intervention Follow-Up */}
                    {isEI && (
                        <Card>
                            <div className="flex items-center gap-2 mb-5 pb-3 border-b border-gray-100">
                                <Baby size={18} className="text-primary" />
                                <h3 className="font-semibold text-text-main">Follow-Up — Developmental Domains</h3>
                            </div>

                            {/* Desktop: Table */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-200">
                                            <th className="text-left py-3 px-4 font-semibold text-text-main w-[160px]">Domain</th>
                                            <th className="text-left py-3 px-4 font-semibold text-text-main">Status <span className="text-red-500">*</span></th>
                                            <th className="text-left py-3 px-4 font-semibold text-text-main">Goal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {EI_DOMAINS.map(domain => {
                                            const statusField = `ei_${domain.key}_status`;
                                            const goalField = `ei_${domain.key}_goal`;
                                            return (
                                                <tr key={domain.key} className="border-b border-gray-100 hover:bg-gray-50/50">
                                                    <td className="py-3 px-4 font-medium text-text-main whitespace-nowrap">{domain.label}</td>
                                                    <td className="py-2 px-4">
                                                        <select
                                                            value={(data[statusField as keyof typeof data] as string) || ''}
                                                            onChange={e => set(statusField, e.target.value)}
                                                            className={`w-full px-2.5 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors[statusField] ? 'border-red-500' : 'border-gray-300'}`}
                                                        >
                                                            <option value="" disabled>Select Status</option>
                                                            {DROPDOWNS[domain.statusKey].map((opt: string) => (
                                                                <option key={opt} value={opt}>{opt}</option>
                                                            ))}
                                                        </select>
                                                        {errors[statusField] && <span className="text-xs text-red-500">{errors[statusField]}</span>}
                                                    </td>
                                                    <td className="py-2 px-4">
                                                        <select
                                                            value={(data[goalField as keyof typeof data] as string) || ''}
                                                            onChange={e => set(goalField, e.target.value)}
                                                            className="w-full px-2.5 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                        >
                                                            <option value="" disabled>Select Goal</option>
                                                            {DROPDOWNS[domain.goalKey].map((opt: string) => (
                                                                <option key={opt} value={opt}>{opt}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile: Card layout */}
                            <div className="md:hidden space-y-4">
                                {EI_DOMAINS.map(domain => {
                                    const statusField = `ei_${domain.key}_status`;
                                    const goalField = `ei_${domain.key}_goal`;
                                    return (
                                        <div key={domain.key} className="p-3 border border-gray-100 rounded-lg bg-gray-50/50">
                                            <p className="font-medium text-text-main mb-2">{domain.label}</p>
                                            <div className="space-y-2">
                                                <div>
                                                    <label className="text-xs text-text-muted">Status *</label>
                                                    <select
                                                        value={(data[statusField as keyof typeof data] as string) || ''}
                                                        onChange={e => set(statusField, e.target.value)}
                                                        className={`w-full px-2.5 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors[statusField] ? 'border-red-500' : 'border-gray-300'}`}
                                                    >
                                                        <option value="" disabled>Select Status</option>
                                                        {DROPDOWNS[domain.statusKey].map((opt: string) => (
                                                            <option key={opt} value={opt}>{opt}</option>
                                                        ))}
                                                    </select>
                                                    {errors[statusField] && <span className="text-xs text-red-500">{errors[statusField]}</span>}
                                                </div>
                                                <div>
                                                    <label className="text-xs text-text-muted">Goal</label>
                                                    <select
                                                        value={(data[goalField as keyof typeof data] as string) || ''}
                                                        onChange={e => set(goalField, e.target.value)}
                                                        className="w-full px-2.5 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                    >
                                                        <option value="" disabled>Select Goal</option>
                                                        {DROPDOWNS[domain.goalKey].map((opt: string) => (
                                                            <option key={opt} value={opt}>{opt}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Summary & Outcome */}
                            <div className="mt-6 pt-4 border-t border-gray-100">
                                <h4 className="font-semibold text-text-main mb-4">Summary & Outcome</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Select
                                        label="Service Level"
                                        value={data.ei_service_level || ''}
                                        onChange={e => set('ei_service_level', e.target.value)}
                                        options={toOptions(DROPDOWNS.EI_ServiceLevel)}
                                        error={errors.ei_service_level}
                                        required
                                    />
                                    <Select
                                        label="Outcome"
                                        value={data.ei_outcome || ''}
                                        onChange={e => set('ei_outcome', e.target.value)}
                                        options={toOptions(DROPDOWNS.EI_Outcome)}
                                        error={errors.ei_outcome}
                                        required
                                    />
                                    <Input
                                        label="Assessor Name"
                                        value={data.ei_assessor_name || ''}
                                        onChange={e => set('ei_assessor_name', e.target.value)}
                                        error={errors.ei_assessor_name}
                                        required
                                    />
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-medium text-text-main">Remarks</label>
                                        <textarea
                                            value={data.ei_remarks || ''}
                                            onChange={e => set('ei_remarks', e.target.value)}
                                            rows={3}
                                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                                            placeholder="Additional notes..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Submit / Cancel */}
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={closeForm}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={isSaving}>
                            {isSaving ? <Loader2 size={16} className="animate-spin mr-2 inline" /> : <Save size={16} className="mr-2 inline" />}
                            {isEditMode ? 'Update Session' : 'Save Session'}
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
}
