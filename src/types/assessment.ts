export interface InitialAssessment {
    patient_id: string;
    assessment_date: string;
    patient_name: string;
    age: number;
    gender: string;
    phone: string;
    village: string;
    primary_condition: string;
    chief_complaint: string;
    side_of_limb_affected: string;
    joint_involved: string;
    document_type: string;
    created_at?: string;
}

export interface ClinicalAssessment {
    id?: number;
    patient_id: string;
    condition: string;
    side_of_limb_affected: string | null;
    joint_involved: string | null;
    // Pain
    rom_aaos: string | null;
    strength_mmt: string | null;
    vas_pre: number | null;
    vas_category_pre: string | null;
    vas_post: number | null;
    vas_category_post: string | null;
    // Neuro
    neuro_strength: string | null;
    neuro_balance: string | null;
    coordination_test: string | null;
    coordination_severity: string | null;
    // Pulmonary
    cough: string | null;
    pulmonary_symptoms: string[] | null;
    dyspnea_mrmc: string | null;
    // Disability
    disability_type: string | null;
    fim_locomotion: string | null;
    fim_mobility: string | null;
    // Post-Op
    postop_surgery_type: string | null;
    weight_bearing_status: string | null;
    functional_mobility_level: string | null;
    // Amputation
    amputation_level: string | null;
    residual_limb_condition: string | null;
    prosthesis_status: string | null;
    amp_level: string | null;
    created_at?: string;
}

export interface FollowUpAssessment {
    id?: number;
    patient_id: string;
    visit_date: string;
    session_number: number;
    condition: string;
    side_of_limb_affected: string | null;
    joint_involved: string | null;
    // Pain
    rom: string | null;
    strength: string | null;
    vas_previous: number | null;
    vas_current: number | null;
    // Neuro
    neuro_strength: string | null;
    balance: string | null;
    coordination_test: string | null;
    coordination_severity: string | null;
    // Pulmonary
    dyspnea_mrmc: string | null;
    // Disability
    fim_locomotion: string | null;
    fim_mobility: string | null;
    // Amputation
    amp_level: string | null;
    created_at?: string;
}
