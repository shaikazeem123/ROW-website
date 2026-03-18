export const DROPDOWNS = {
    Gender: ['Male', 'Female', 'Other'],

    Condition: ['Pain', 'Neuro', 'Pulmonary', 'Post-Operative', 'Disability', 'Amputation'],

    ChiefComplaint: [
        'Joint pain', 'Back pain', 'Neck pain', 'Post injury pain',
        'Limb weakness', 'Balance problem', 'Coordination problem',
        'Breathlessness', 'Cough', 'Chest tightness', 'Post surgical pain',
        'Joint stiffness', 'Difficulty walking', 'Difficulty transfers',
        'Stump pain', 'Prosthetic training', 'Other',
    ],

    LimbSide: ['Left', 'Right', 'Bilateral'],

    Joint: ['Shoulder', 'Elbow', 'Wrist', 'Hip', 'Knee', 'Ankle', 'Spine', 'Multiple'],

    Documents: ['BPL', 'APL', 'AADHAR', 'UDID'],

    ROM: ['Full', 'Mild Restriction', 'Moderate Restriction', 'Severe Restriction'],

    Strength: [
        'Normal (MMT 5)',
        'Mild Weakness (MMT 4)',
        'Moderate Weakness (MMT 3)',
        'Severe Weakness (≤2)',
    ],

    Balance: ['Good', 'Fair', 'Poor', 'Unable'],

    CoordinationTests: [
        'Finger-to-Nose Test',
        'Heel-to-Shin Test',
        'Rapid Alternating Movements (Dysdiadochokinesia)',
        'Finger Tapping Test',
    ],

    CoordinationSeverity: [
        'Normal', 'Mild Impairment', 'Moderate Impairment', 'Severe Impairment',
    ],

    Cough: ['No cough', 'Dry cough', 'Productive cough'],

    PulmonarySymptoms: [
        'Breathlessness', 'Wheezing', 'Chest tightness', 'Sputum', 'Fatigue',
    ],

    Dyspnea: [
        '0 Breathless with strenuous exercise',
        '1 Breathless when hurrying',
        '2 Walk slower than same age',
        '3 Stop after 100m',
        '4 Too breathless to leave house',
    ],

    DisabilityType: [
        'Locomotor disability', 'Neurological disability', 'Post-stroke',
        'Spinal cord injury', 'Cerebral palsy', 'Other',
    ],

    FIM: [
        '1 Total Assistance', '2 Max Assistance', '3 Moderate Assistance',
        '4 Minimal Assistance', '5 Supervision',
        '6 Modified Independence', '7 Complete Independence',
    ],

    SurgeryType: [
        'Joint Replacement', 'Fracture Fixation',
        'Ligament Repair', 'Spinal Surgery', 'Other',
    ],

    WeightBearing: [
        'Non Weight Bearing', 'Toe Touch', 'Partial Weight Bearing',
        'Weight Bearing As Tolerated', 'Full Weight Bearing',
    ],

    Mobility: [
        'Bed Mobility', 'Sitting', 'Standing',
        'Walking with Support', 'Independent Walking',
    ],

    AmputationLevel: [
        'Toe', 'Transmetatarsal', 'Syme',
        'Below Knee (BKA)', 'Above Knee (AKA)', 'Hip Disarticulation',
    ],

    ResidualLimb: [
        'Healthy', 'Edema', 'Wound', 'Infection', 'Contracture Risk',
    ],

    Prosthesis: [
        'Not Fitted', 'Temporary Prosthesis', 'Definitive Prosthesis', 'Training Phase',
    ],

    AMP: [
        'K0 No Prosthetic Mobility', 'K1 Household Ambulator',
        'K2 Limited Community Ambulator', 'K3 Community Ambulator',
        'K4 High Activity User',
    ],
};

/** Convert a string array to {value, label} options for the Select component */
export function toOptions(arr: string[]) {
    return arr.map(v => ({ value: v, label: v }));
}
