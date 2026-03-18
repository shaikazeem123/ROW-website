

import React from 'react';

const options = {
    assessmentPeriod: ['Initial Assessment', 'Follow-up', 'Reassessment', 'Discharge'],
    diagnosis: ['COPD', 'Asthma', 'Bronchiectasis', 'Interstitial Lung Disease', 'Pneumonia', 'Post-COVID Condition', 'Tuberculosis', 'Restrictive Lung Disease', 'Other'],
    breathSounds: ['Normal Vesicular', 'Wheeze', 'Crackles', 'Rhonchi', 'Reduced Air Entry'],
    dyspnea: ['Grade 0 - Breathless only with strenuous exercise', 'Grade 1 - Breathless when hurrying', 'Grade 2 - Walks slower than people of same age', 'Grade 3 - Stops after walking 100m', 'Grade 4 - Too breathless to leave house'],
    cough: ['No Cough', 'Dry Cough', 'Productive Cough'],
    sputumType: ['None', 'Mucoid', 'Purulent', 'Blood Stained'],
    sputumAmount: ['None', 'Scanty', 'Moderate', 'Large'],
    oxygenSupport: ['Room Air', 'Nasal Cannula', 'Simple Face Mask', 'Non-Rebreather Mask', 'Non-invasive Ventilation'],
    chestExpansion: ['Normal', 'Reduced', 'Severely Reduced'],
    exerciseTolerance: ['Normal', 'Mild Limitation', 'Moderate Limitation', 'Severe Limitation'],
    functionalStatus: ['Independent', 'Minimal Assistance', 'Moderate Assistance', 'Dependent'],
    rehabPlan: ['Breathing Exercises', 'Airway Clearance Techniques', 'Incentive Spirometry', 'Thoracic Expansion Exercises', 'Pulmonary Rehabilitation Exercise', 'Postural Drainage', 'Education and Home Exercise Program'],
    staffDesignation: ['Physiotherapist', 'Senior Physiotherapist', 'Respiratory Therapist', 'Rehabilitation Therapist', 'Assistant Therapist']
};

interface PulmonaryFormData {
    assessmentPeriod?: string;
    diagnosis?: string;
    chiefComplaints?: string;
    breathSounds?: string;
    dyspnea?: string;
    cough?: string;
    sputumType?: string;
    sputumAmount?: string;
    spO2?: string;
    respiratoryRate?: string;
    oxygenSupport?: string;
    chestExpansion?: string;
    exerciseTolerance?: string;
    functionalStatus?: string;
    rehabPlan?: string;
    staffDesignation?: string;
    [key: string]: string | undefined;
}

interface Props {
    data: PulmonaryFormData;
    onChange: (data: PulmonaryFormData) => void;
}

export function PulmonaryAssessmentForm({ data, onChange }: Props) {
    const handleChange = (field: string, value: string) => {
        onChange({ ...data, [field]: value });
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Assessment Period */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Assessment Period (Type)</label>
                    <select
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
                        value={data.assessmentPeriod || ''}
                        onChange={(e) => handleChange('assessmentPeriod', e.target.value)}
                    >
                        <option value="">Select Period...</option>
                        {options.assessmentPeriod.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                </div>

                {/* Diagnosis */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Respiratory Diagnosis</label>
                    <select
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
                        value={data.diagnosis || ''}
                        onChange={(e) => handleChange('diagnosis', e.target.value)}
                    >
                        <option value="">Select Diagnosis...</option>
                        {options.diagnosis.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                </div>

                {/* Chief Complaints */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Chief Complaints</label>
                    <textarea
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
                        rows={2}
                        value={data.chiefComplaints || ''}
                        onChange={(e) => handleChange('chiefComplaints', e.target.value)}
                        placeholder="Enter full description of chief complaints..."
                    />
                </div>

                {/* Breath Sounds */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Breath Sounds</label>
                    <select
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
                        value={data.breathSounds || ''}
                        onChange={(e) => handleChange('breathSounds', e.target.value)}
                    >
                        <option value="">Select...</option>
                        {options.breathSounds.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                </div>

                {/* Dyspnea */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Dyspnea</label>
                    <select
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
                        value={data.dyspnea || ''}
                        onChange={(e) => handleChange('dyspnea', e.target.value)}
                    >
                        <option value="">Select...</option>
                        {options.dyspnea.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                </div>

                {/* Cough */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Cough</label>
                    <select
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
                        value={data.cough || ''}
                        onChange={(e) => handleChange('cough', e.target.value)}
                    >
                        <option value="">Select...</option>
                        {options.cough.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                </div>

                {/* Sputum Type */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Sputum Type</label>
                    <select
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
                        value={data.sputumType || ''}
                        onChange={(e) => handleChange('sputumType', e.target.value)}
                    >
                        <option value="">Select...</option>
                        {options.sputumType.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                </div>

                {/* Sputum Amount */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Sputum Amount</label>
                    <select
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
                        value={data.sputumAmount || ''}
                        onChange={(e) => handleChange('sputumAmount', e.target.value)}
                    >
                        <option value="">Select...</option>
                        {options.sputumAmount.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                </div>

                {/* SpO2 */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">SpO2 (%)</label>
                    <input
                        type="number"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
                        value={data.spO2 || ''}
                        onChange={(e) => handleChange('spO2', e.target.value)}
                        placeholder="e.g. 98"
                    />
                </div>

                {/* Respiratory Rate */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Respiratory Rate (breaths/min)</label>
                    <input
                        type="number"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
                        value={data.respiratoryRate || ''}
                        onChange={(e) => handleChange('respiratoryRate', e.target.value)}
                        placeholder="e.g. 16"
                    />
                </div>

                {/* Oxygen Support */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Oxygen Support</label>
                    <select
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
                        value={data.oxygenSupport || ''}
                        onChange={(e) => handleChange('oxygenSupport', e.target.value)}
                    >
                        <option value="">Select...</option>
                        {options.oxygenSupport.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                </div>

                {/* Chest Expansion */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Chest Expansion</label>
                    <select
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
                        value={data.chestExpansion || ''}
                        onChange={(e) => handleChange('chestExpansion', e.target.value)}
                    >
                        <option value="">Select...</option>
                        {options.chestExpansion.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                </div>

                {/* Exercise Tolerance */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Exercise Tolerance</label>
                    <select
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
                        value={data.exerciseTolerance || ''}
                        onChange={(e) => handleChange('exerciseTolerance', e.target.value)}
                    >
                        <option value="">Select...</option>
                        {options.exerciseTolerance.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                </div>

                {/* Functional Status */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Functional Status</label>
                    <select
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
                        value={data.functionalStatus || ''}
                        onChange={(e) => handleChange('functionalStatus', e.target.value)}
                    >
                        <option value="">Select...</option>
                        {options.functionalStatus.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                </div>

                {/* Pulmonary Rehab Plan */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Pulmonary Rehab Plan</label>
                    <select
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
                        value={data.rehabPlan || ''}
                        onChange={(e) => handleChange('rehabPlan', e.target.value)}
                    >
                        <option value="">Select...</option>
                        {options.rehabPlan.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                </div>

                {/* Staff Designation */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Staff Designation</label>
                    <select
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
                        value={data.staffDesignation || ''}
                        onChange={(e) => handleChange('staffDesignation', e.target.value)}
                    >
                        <option value="">Select Designation...</option>
                        {options.staffDesignation.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                </div>
            </div>
        </div>
    );
}
