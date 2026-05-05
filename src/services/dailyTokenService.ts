import { supabase } from '@/lib/supabase';

export interface DailyToken {
    id: string;
    center_name: string;
    token_number: string;
    sequence_number: number;
    beneficiary_name: string;
    beneficiary_id: string | null;
    phone_number: string;
    area: string;
    date: string; // YYYY-MM-DD
    time: string; // HH:mm:ss
    status: 'Waiting' | 'Completed' | 'Skipped';
    created_at: string;
}

export const DailyTokenService = {
    async createToken(tokenData: {
        center_name: string;
        beneficiary_name: string;
        beneficiary_id?: string | null;
        phone_number?: string;
        area?: string;
        date: string;
        time?: string;
    }) {
        const { data, error } = await supabase
            .from('tokens')
            .insert([{
                center_name: tokenData.center_name,
                beneficiary_name: tokenData.beneficiary_name,
                beneficiary_id: tokenData.beneficiary_id || null,
                phone_number: tokenData.phone_number || '',
                area: tokenData.area || '',
                date: tokenData.date,
                time: tokenData.time || new Date().toLocaleTimeString('en-GB', { hour12: false }),
                status: 'Waiting'
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating token:', error);
            throw error;
        }
        return data as DailyToken;
    },

    async getTokensForDate(centerName: string, date: string) {
        const { data, error } = await supabase
            .from('tokens')
            .select('*')
            .eq('center_name', centerName)
            .eq('date', date)
            .order('sequence_number', { ascending: true });

        if (error) {
            console.error('Error fetching tokens:', error);
            throw error;
        }
        return data as DailyToken[];
    },

    async updateStatus(tokenId: string, status: 'Waiting' | 'Completed' | 'Skipped') {
        const { data, error } = await supabase
            .from('tokens')
            .update({ status })
            .eq('id', tokenId)
            .select()
            .single();

        if (error) {
            console.error('Error updating token status:', error);
            throw error;
        }
        return data as DailyToken;
    },

    async getAllTokens() {
        const { data, error } = await supabase
            .from('tokens')
            .select('*')
            .order('date', { ascending: false })
            .order('sequence_number', { ascending: false })
            .limit(100);

        if (error) {
            console.error('Error fetching all tokens:', error);
            throw error;
        }
        return data as DailyToken[];
    }
};
