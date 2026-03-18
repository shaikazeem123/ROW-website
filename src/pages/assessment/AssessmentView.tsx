import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Loader } from '@/components/common/Loader';
import { assessmentService } from '@/services/assessmentService';
import { getVASCategory } from '@/utils/assessmentLogic';
import type { InitialAssessment, ClinicalAssessment, FollowUpAssessment } from '@/types/assessment';
import {
    ClipboardList,
    User,
    Activity,
    Calendar,
    Edit,
    ArrowLeft,
    Stethoscope,
    CheckCircle2,
    XCircle,
} from 'lucide-react';

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
    return (
        <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
            <p className="text-sm font-medium text-text-main">{value ?? '—'}</p>
        </div>
    );
}

const conditionColors: Record<string, string> = {
    'Pain': 'bg-red-100 text-red-700',
    'Neuro': 'bg-purple-100 text-purple-700',
    'Pulmonary': 'bg-blue-100 text-blue-700',
    'Post-Operative': 'bg-amber-100 text-amber-700',
    'Disability': 'bg-teal-100 text-teal-700',
    'Amputation': 'bg-orange-100 text-orange-700',
};

export function AssessmentViewPage() {
    const { patientId } = useParams<{ patientId: string }>();
    const navigate = useNavigate();

    const [initial, setInitial] = useState<InitialAssessment | null>(null);
    const [clinical, setClinical] = useState<ClinicalAssessment | null>(null);
    const [followUps, setFollowUps] = useState<FollowUpAssessment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!patientId) return;
        const load = async () => {
            setIsLoading(true);
            const [init, clin, fups] = await Promise.all([
                assessmentService.getInitial(patientId),
                assessmentService.getClinical(patientId),
                assessmentService.getFollowUps(patientId),
            ]);
            setInitial(init);
            setClinical(clin);
            setFollowUps(fups);
            setIsLoading(false);
        };
        load();
    }, [patientId]);

    if (isLoading) return <Loader />;

    if (!initial) {
        return (
            <div className="text-center py-24">
                <XCircle size={48} className="text-red-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">Patient not found.</p>
                <Button variant="outline" className="mt-4" onClick={() => navigate('/assessments/history')}>
                    <ArrowLeft size={16} className="mr-2 inline" /> Back to History
                </Button>
            </div>
        );
    }

    const condition = initial.primary_condition;

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 rounded-xl">
                        <ClipboardList className="text-primary" size={22} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-text-main">{initial.patient_name}</h1>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-mono font-bold text-blue-600">{initial.patient_id}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${conditionColors[condition] || 'bg-gray-100 text-gray-700'}`}>
                                {condition}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => navigate('/assessments/history')}>
                        <ArrowLeft size={16} className="mr-2 inline" /> Back
                    </Button>
                    <Button onClick={() => navigate(`/assessments/edit/${initial.patient_id}`)}>
                        <Edit size={16} className="mr-2 inline" /> Edit Assessment
                    </Button>
                </div>
            </div>

            {/* ── Step 1: Initial Assessment ── */}
            <Card>
                <div className="flex items-center gap-2 mb-5 pb-3 border-b border-gray-100">
                    <User size={18} className="text-primary" />
                    <h3 className="font-semibold text-text-main">Step 1 — Initial Assessment</h3>
                    <CheckCircle2 size={16} className="text-green-500 ml-auto" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                    <Field label="Assessment Date" value={new Date(initial.assessment_date).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })} />
                    <Field label="Age" value={initial.age} />
                    <Field label="Gender" value={initial.gender} />
                    <Field label="Phone" value={initial.phone} />
                    <Field label="Village" value={initial.village} />
                    <Field label="Primary Condition" value={initial.primary_condition} />
                    <Field label="Chief Complaint" value={initial.chief_complaint} />
                    <Field label="Side of Limb" value={initial.side_of_limb_affected} />
                    <Field label="Joint Involved" value={initial.joint_involved} />
                    <Field label="Document Type" value={initial.document_type} />
                </div>
            </Card>

            {/* ── Step 2: Clinical Assessment ── */}
            <Card>
                <div className="flex items-center gap-2 mb-5 pb-3 border-b border-gray-100">
                    <Stethoscope size={18} className="text-primary" />
                    <h3 className="font-semibold text-text-main">Step 2 — Clinical Assessment ({condition})</h3>
                    {clinical
                        ? <CheckCircle2 size={16} className="text-green-500 ml-auto" />
                        : <span className="ml-auto text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Pending</span>
                    }
                </div>

                {!clinical ? (
                    <p className="text-sm text-gray-400 text-center py-8">Clinical assessment not completed yet.</p>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                        <Field label="Side of Limb" value={clinical.side_of_limb_affected} />
                        <Field label="Joint Involved" value={clinical.joint_involved} />

                        {/* Pain */}
                        {condition === 'Pain' && (
                            <>
                                <Field label="ROM (AAOS)" value={clinical.rom_aaos} />
                                <Field label="Strength (MMT)" value={clinical.strength_mmt} />
                                <Field label="VAS Pre" value={clinical.vas_pre} />
                                <Field label="VAS Category (Pre)" value={clinical.vas_pre != null ? getVASCategory(clinical.vas_pre) : null} />
                                <Field label="VAS Post" value={clinical.vas_post} />
                                <Field label="VAS Category (Post)" value={clinical.vas_post != null ? getVASCategory(clinical.vas_post) : null} />
                            </>
                        )}

                        {/* Neuro */}
                        {condition === 'Neuro' && (
                            <>
                                <Field label="Neuro Strength" value={clinical.neuro_strength} />
                                <Field label="Balance" value={clinical.neuro_balance} />
                                <Field label="Coordination Test" value={clinical.coordination_test} />
                                <Field label="Coordination Severity" value={clinical.coordination_severity} />
                            </>
                        )}

                        {/* Pulmonary */}
                        {condition === 'Pulmonary' && (
                            <>
                                <Field label="Cough" value={clinical.cough} />
                                <Field label="Pulmonary Symptoms" value={clinical.pulmonary_symptoms?.join(', ')} />
                                <Field label="Dyspnea (mMRC)" value={clinical.dyspnea_mrmc} />
                            </>
                        )}

                        {/* Disability */}
                        {condition === 'Disability' && (
                            <>
                                <Field label="Disability Type" value={clinical.disability_type} />
                                <Field label="FIM Locomotion" value={clinical.fim_locomotion} />
                                <Field label="FIM Mobility" value={clinical.fim_mobility} />
                            </>
                        )}

                        {/* Post-Operative */}
                        {condition === 'Post-Operative' && (
                            <>
                                <Field label="Surgery Type" value={clinical.postop_surgery_type} />
                                <Field label="Weight Bearing Status" value={clinical.weight_bearing_status} />
                                <Field label="Functional Mobility" value={clinical.functional_mobility_level} />
                            </>
                        )}

                        {/* Amputation */}
                        {condition === 'Amputation' && (
                            <>
                                <Field label="Amputation Level" value={clinical.amputation_level} />
                                <Field label="Residual Limb Condition" value={clinical.residual_limb_condition} />
                                <Field label="Prosthesis Status" value={clinical.prosthesis_status} />
                                <Field label="AMP Level (K-Level)" value={clinical.amp_level} />
                            </>
                        )}
                    </div>
                )}
            </Card>

            {/* ── Step 3: Follow-Up Sessions ── */}
            <Card>
                <div className="flex items-center gap-2 mb-5 pb-3 border-b border-gray-100">
                    <Calendar size={18} className="text-primary" />
                    <h3 className="font-semibold text-text-main">Step 3 — Follow-Up Sessions</h3>
                    <span className="ml-auto text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {followUps.length} session{followUps.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {followUps.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">No follow-up sessions recorded yet.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="text-left py-2 px-3 font-bold text-[10px] uppercase text-gray-400 tracking-wider">#</th>
                                    <th className="text-left py-2 px-3 font-bold text-[10px] uppercase text-gray-400 tracking-wider">Date</th>
                                    <th className="text-left py-2 px-3 font-bold text-[10px] uppercase text-gray-400 tracking-wider">Side</th>
                                    <th className="text-left py-2 px-3 font-bold text-[10px] uppercase text-gray-400 tracking-wider">Joint</th>
                                    {condition === 'Pain' && (
                                        <>
                                            <th className="text-left py-2 px-3 font-bold text-[10px] uppercase text-gray-400 tracking-wider">ROM</th>
                                            <th className="text-left py-2 px-3 font-bold text-[10px] uppercase text-gray-400 tracking-wider">Strength</th>
                                            <th className="text-left py-2 px-3 font-bold text-[10px] uppercase text-gray-400 tracking-wider">VAS Prev</th>
                                            <th className="text-left py-2 px-3 font-bold text-[10px] uppercase text-gray-400 tracking-wider">VAS Curr</th>
                                        </>
                                    )}
                                    {condition === 'Neuro' && (
                                        <>
                                            <th className="text-left py-2 px-3 font-bold text-[10px] uppercase text-gray-400 tracking-wider">Strength</th>
                                            <th className="text-left py-2 px-3 font-bold text-[10px] uppercase text-gray-400 tracking-wider">Balance</th>
                                            <th className="text-left py-2 px-3 font-bold text-[10px] uppercase text-gray-400 tracking-wider">Coord. Test</th>
                                            <th className="text-left py-2 px-3 font-bold text-[10px] uppercase text-gray-400 tracking-wider">Severity</th>
                                        </>
                                    )}
                                    {condition === 'Pulmonary' && (
                                        <th className="text-left py-2 px-3 font-bold text-[10px] uppercase text-gray-400 tracking-wider">Dyspnea (mMRC)</th>
                                    )}
                                    {condition === 'Disability' && (
                                        <>
                                            <th className="text-left py-2 px-3 font-bold text-[10px] uppercase text-gray-400 tracking-wider">FIM Locomotion</th>
                                            <th className="text-left py-2 px-3 font-bold text-[10px] uppercase text-gray-400 tracking-wider">FIM Mobility</th>
                                        </>
                                    )}
                                    {condition === 'Amputation' && (
                                        <th className="text-left py-2 px-3 font-bold text-[10px] uppercase text-gray-400 tracking-wider">AMP Level</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {followUps.map(row => (
                                    <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                                        <td className="py-3 px-3 font-bold">{row.session_number}</td>
                                        <td className="py-3 px-3">
                                            {new Date(row.visit_date).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="py-3 px-3">{row.side_of_limb_affected || '—'}</td>
                                        <td className="py-3 px-3">{row.joint_involved || '—'}</td>
                                        {condition === 'Pain' && (
                                            <>
                                                <td className="py-3 px-3">{row.rom || '—'}</td>
                                                <td className="py-3 px-3">{row.strength || '—'}</td>
                                                <td className="py-3 px-3">{row.vas_previous ?? '—'}</td>
                                                <td className="py-3 px-3">{row.vas_current ?? '—'}</td>
                                            </>
                                        )}
                                        {condition === 'Neuro' && (
                                            <>
                                                <td className="py-3 px-3">{row.neuro_strength || '—'}</td>
                                                <td className="py-3 px-3">{row.balance || '—'}</td>
                                                <td className="py-3 px-3">{row.coordination_test || '—'}</td>
                                                <td className="py-3 px-3">{row.coordination_severity || '—'}</td>
                                            </>
                                        )}
                                        {condition === 'Pulmonary' && (
                                            <td className="py-3 px-3">{row.dyspnea_mrmc || '—'}</td>
                                        )}
                                        {condition === 'Disability' && (
                                            <>
                                                <td className="py-3 px-3">{row.fim_locomotion || '—'}</td>
                                                <td className="py-3 px-3">{row.fim_mobility || '—'}</td>
                                            </>
                                        )}
                                        {condition === 'Amputation' && (
                                            <td className="py-3 px-3">{row.amp_level || '—'}</td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Edit Button at Bottom */}
            <div className="flex items-center justify-between bg-surface p-5 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3">
                    <Activity size={18} className="text-primary" />
                    <span className="text-sm text-text-muted">
                        Need to update this assessment? Edit any step below.
                    </span>
                </div>
                <Button onClick={() => navigate(`/assessments/edit/${initial.patient_id}`)}>
                    <Edit size={16} className="mr-2 inline" /> Edit Assessment
                </Button>
            </div>
        </div>
    );
}
