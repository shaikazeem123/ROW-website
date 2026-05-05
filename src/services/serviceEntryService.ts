
import { supabase } from '@/lib/supabase';
import type { ServiceEntry, ServiceEntryPayload } from '@/types/serviceEntry';

export const ServiceEntryService = {
    /**
     * Creates a new service entry.
     * Hidden fields are handled internally as NULL by default as per requirement.
     */
    async createEntry(payload: ServiceEntryPayload & { remarks?: string | null }) {
        const { remarks, ...rest } = payload;
        const { data, error } = await supabase
            .from('service_entries')
            .insert([{
                ...rest,
                // These fields are hidden in UI and will be NULL by default via DB or explicit NULL
                recommendation: null,
                contribution: null,
                balance: null,
                total: null,
                outcome: null,
                outcome_description: null,
                receipt_no: null,
                custom_field4: null,
                custom_field5: null,
                remarks: remarks ?? null
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating service entry:', error);
            throw error;
        }
        return data as ServiceEntry;
    },

    /**
     * Fetches beneficiaries for the search dropdown
     */
    async searchBeneficiaries(query: string) {
        if (!query || query.length < 1) return [];

        const { data, error } = await supabase
            .from('beneficiaries')
            .select('id, name, file_number, mobile_no')
            .or(`file_number.ilike.%${query}%,name.ilike.%${query}%`)
            .limit(10);

        if (error) {
            console.error('Error searching beneficiaries:', error);
            return [];
        }
        return data;
    },

    /**
     * Fetches service history for a specific file number
     */
    async getHistoryByFileNumber(fileNumber: string) {
        const { data, error } = await supabase
            .from('service_entries')
            .select('*')
            .eq('file_number', fileNumber)
            .order('schedule_date', { ascending: false });

        if (error) {
            console.error('Error fetching service history:', error);
            throw error;
        }
        return data as ServiceEntry[];
    },

    /**
     * Fetches a single service entry by ID
     */
    async getEntryById(id: string) {
        const { data, error } = await supabase
            .from('service_entries')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching service entry:', error);
            throw error;
        }
        return data as ServiceEntry;
    },

    /**
     * Updates an existing service entry
     */
    async updateEntry(id: string, payload: Partial<ServiceEntry>) {
        const { data, error } = await supabase
            .from('service_entries')
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating service entry:', error);
            throw error;
        }
        return data as ServiceEntry;
    }
};
