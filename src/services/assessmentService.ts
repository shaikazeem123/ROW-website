import { supabase } from '@/lib/supabase';
import type { InitialAssessment, ClinicalAssessment, FollowUpAssessment } from '@/types/assessment';

export const assessmentService = {
    // ── Generate Patient ID ──
    // Format: ROW-YYYYMMDD-XXXX (sequential per day)
    async generatePatientId(): Promise<string> {
        const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const prefix = `ROW-${today}-`;

        const { data, error } = await supabase
            .from('initial_assessment')
            .select('patient_id')
            .like('patient_id', `${prefix}%`)
            .order('patient_id', { ascending: false })
            .limit(1);

        let seq = 1;
        if (!error && data && data.length > 0) {
            const lastNum = parseInt(data[0].patient_id.split('-').pop() || '0', 10);
            seq = lastNum + 1;
        }

        return `${prefix}${String(seq).padStart(4, '0')}`;
    },

    // ── Initial Assessment (Step 1) ──

    async createInitial(data: Omit<InitialAssessment, 'created_at'>): Promise<InitialAssessment> {
        const { data: result, error } = await supabase
            .from('initial_assessment')
            .insert(data)
            .select()
            .single();
        if (error) { console.error('Create initial assessment error:', error); throw error; }
        return result as InitialAssessment;
    },

    async getInitial(patientId: string): Promise<InitialAssessment | null> {
        const { data, error } = await supabase
            .from('initial_assessment')
            .select('*')
            .eq('patient_id', patientId)
            .single();
        if (error) { console.error('Get initial assessment error:', error); return null; }
        return data as InitialAssessment;
    },

    async updateInitial(patientId: string, data: Partial<InitialAssessment>): Promise<InitialAssessment> {
        const { data: result, error } = await supabase
            .from('initial_assessment')
            .update(data)
            .eq('patient_id', patientId)
            .select()
            .single();
        if (error) { console.error('Update initial assessment error:', error); throw error; }
        return result as InitialAssessment;
    },

    // ── Clinical Assessment (Step 2) ──

    async createClinical(data: Omit<ClinicalAssessment, 'id' | 'created_at'>): Promise<ClinicalAssessment> {
        const { data: result, error } = await supabase
            .from('clinical_assessment')
            .insert(data)
            .select()
            .single();
        if (error) { console.error('Create clinical assessment error:', error); throw error; }
        return result as ClinicalAssessment;
    },

    async getClinical(patientId: string): Promise<ClinicalAssessment | null> {
        const { data, error } = await supabase
            .from('clinical_assessment')
            .select('*')
            .eq('patient_id', patientId)
            .single();
        if (error) { console.error('Get clinical assessment error:', error); return null; }
        return data as ClinicalAssessment;
    },

    async updateClinical(id: number, data: Partial<ClinicalAssessment>): Promise<ClinicalAssessment> {
        const { data: result, error } = await supabase
            .from('clinical_assessment')
            .update(data)
            .eq('id', id)
            .select()
            .single();
        if (error) { console.error('Update clinical assessment error:', error); throw error; }
        return result as ClinicalAssessment;
    },

    // ── Follow-Up Assessment (Step 3) ──

    async createFollowUp(data: Omit<FollowUpAssessment, 'id' | 'created_at'>): Promise<FollowUpAssessment> {
        const { data: result, error } = await supabase
            .from('follow_up_assessment')
            .insert(data)
            .select()
            .single();
        if (error) { console.error('Create follow-up assessment error:', error); throw error; }
        return result as FollowUpAssessment;
    },

    async updateFollowUp(id: number, data: Partial<FollowUpAssessment>): Promise<FollowUpAssessment> {
        const { data: result, error } = await supabase
            .from('follow_up_assessment')
            .update(data)
            .eq('id', id)
            .select()
            .single();
        if (error) { console.error('Update follow-up error:', error); throw error; }
        return result as FollowUpAssessment;
    },

    async getFollowUps(patientId: string): Promise<FollowUpAssessment[]> {
        const { data, error } = await supabase
            .from('follow_up_assessment')
            .select('*')
            .eq('patient_id', patientId)
            .order('session_number', { ascending: true });
        if (error) { console.error('Get follow-ups error:', error); return []; }
        return (data || []) as FollowUpAssessment[];
    },

    async getLatestFollowUp(patientId: string): Promise<FollowUpAssessment | null> {
        const { data, error } = await supabase
            .from('follow_up_assessment')
            .select('*')
            .eq('patient_id', patientId)
            .order('session_number', { ascending: false })
            .limit(1)
            .single();
        if (error) { console.error('Get latest follow-up error:', error); return null; }
        return data as FollowUpAssessment;
    },
};
