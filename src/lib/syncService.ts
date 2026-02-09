import { db } from './db';
import { supabase } from './supabase';
import { TokenService } from '@/services/tokenService';

export const SyncService = {
    async syncPendingRecords() {
        if (!navigator.onLine) return;

        // Fetch both pending and failed records to retry
        const recordsToSync = await db.beneficiaries
            .where('sync_status')
            .anyOf(['pending', 'failed'])
            .toArray();

        if (recordsToSync.length === 0) return;

        console.log(`[SyncService] Starting sync for ${recordsToSync.length} records...`);

        for (const record of recordsToSync) {
            try {
                // Remove local UI fields and metadata before syncing
                const dataToSync = Object.fromEntries(
                    Object.entries(record).filter(([key]) => !['id', 'sync_status', 'error_message'].includes(key))
                );

                // Try to insert and get the assigned token_no
                const { data, error } = await supabase
                    .from('beneficiaries')
                    .insert([dataToSync])
                    .select('*')
                    .single();

                if (error) {
                    // Handle duplicate offline_token (already synced but local state didn't update)
                    if (error.code === '23505') {
                        console.warn(`[SyncService] Record ${record.offline_token} already exists on server.`);
                        await db.beneficiaries.update(record.id!, { sync_status: 'synced' });
                    } else {
                        throw error;
                    }
                } else {
                    // Update local record with synced status and the real token_no from server
                    await db.beneficiaries.update(record.id!, {
                        sync_status: 'synced',
                        token_no: data.token_no
                    });

                    // Ensure local sequence is up to date
                    if (data.token_no) {
                        await TokenService.updateLastToken(data.token_no);
                    }
                    console.log(`[SyncService] Successfully synced ${record.name} (Token: ${data.token_no})`);
                }
            } catch (err) {
                console.error(`[SyncService] Sync failed for ${record.name}:`, err);
                const message = err instanceof Error ? err.message : 'Unknown error';
                await db.beneficiaries.update(record.id!, {
                    sync_status: 'failed',
                    error_message: message
                });
            }
        }
    }
};
