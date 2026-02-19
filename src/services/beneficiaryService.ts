import { supabase } from '@/lib/supabase';
import { db } from '@/lib/db';

export interface UpdateResult {
    success: boolean;
    error?: string;
}

export const updateBeneficiaryFileNumber = async (systemId: string, fileNumber: string): Promise<UpdateResult> => {
    try {
        // 1. Try updating in Supabase (for synced records)
        // We match by either ID (UUID) or offline_token
        const { data, error } = await supabase
            .from('beneficiaries')
            .update({ file_number: fileNumber })
            .or(`id.eq.${systemId},offline_token.eq.${systemId}`)
            .select();

        if (error) {
            console.error('Supabase update error:', error);
            // Fallback to local DB if Supabase fails (e.g. offline or other error)
            const localUpdated = await db.beneficiaries
                .where('offline_token')
                .equals(systemId)
                .modify({ file_number: fileNumber });

            if (localUpdated) {
                return { success: true };
            }
            return { success: false, error: error.message };
        }

        if (data && data.length > 0) {
            return { success: true };
        }

        // 2. If not found in Supabase, try local DB (for pending offline records)
        const localUpdated = await db.beneficiaries
            .where('offline_token')
            .equals(systemId)
            .modify({ file_number: fileNumber });

        if (localUpdated) {
            return { success: true };
        }

        return { success: false, error: 'Not Matched' };
    } catch (err) {
        console.error('Update beneficiary file number error:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
};
