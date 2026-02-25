
export interface ServiceEntry {
    id: string;
    status: 'SCHEDULED' | 'AVAILED';
    file_number: string;
    schedule_date: string;
    start_date: string;
    end_date: string | null;
    location_code: string;
    service_code: string;
    service_provider_code: string;
    recommendation: string | null;
    contribution: number | null;
    balance: number | null;
    total: number | null;
    outcome: string | null;
    outcome_description: string | null;
    receipt_no: string | null;
    total_hours: number;
    custom_field2: string | null;
    mode_of_service: string;
    custom_field4: string | null;
    custom_field5: string | null;
    remarks: string | null;
    created_at: string;
    updated_at: string;
    created_by?: string;
}

export type ServiceEntryPayload = Pick<ServiceEntry,
    'status' |
    'file_number' |
    'schedule_date' |
    'start_date' |
    'end_date' |
    'location_code' |
    'service_code' |
    'service_provider_code' |
    'total_hours' |
    'mode_of_service'
>;
