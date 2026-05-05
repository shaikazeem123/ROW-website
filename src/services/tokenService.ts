import { db } from '@/lib/db';
import { supabase } from '@/lib/supabase';

export const TokenService = {
    async getLastToken(): Promise<number> {
        let maxToken = 0;

        // 1. Check local database for max token_no
        const localBeneficiaries = await db.beneficiaries.toArray();
        const localMax = localBeneficiaries.reduce((max, b) => {
            if (b.token_no && b.token_no > max) return b.token_no;
            // Also try to parse token from offline_token if it's formatted as sequence
            // e.g. FIELD-20260205-0007 -> 7
            if (b.offline_token) {
                const parts = b.offline_token.split('-');
                const seq = parseInt(parts[parts.length - 1]);
                if (!isNaN(seq) && seq > max) return seq;
            }
            return max;
        }, 0);

        // 2. Check metadata table for last known max
        const savedMeta = await db.metadata.get('last_token_number');
        const savedMax = savedMeta ? (savedMeta.value as number) : 0;

        maxToken = Math.max(localMax, savedMax);

        // 3. Fallback/Sync with server if online
        if (navigator.onLine) {
            try {
                const { data, error } = await supabase
                    .from('beneficiaries')
                    .select('token_no')
                    .order('token_no', { ascending: false })
                    .limit(1);

                if (!error && data && data.length > 0) {
                    const serverMax = data[0].token_no || 0;
                    if (serverMax > maxToken) {
                        maxToken = serverMax;
                        await this.updateLastToken(maxToken);
                    }
                }
            } catch (err) {
                console.error('Error fetching max token from server:', err);
            }
        }

        return maxToken;
    },

    async updateLastToken(tokenNo: number) {
        await db.metadata.put({ key: 'last_token_number', value: tokenNo });
    },

    async getNextToken(): Promise<number> {
        const lastToken = await this.getLastToken();
        const nextToken = lastToken + 1;
        // Optimization: We don't update metadata yet, we wait for it to be used.
        // Actually, better to update it when used in AddBeneficiary.
        return nextToken;
    }
};
