import Dexie, { type Table } from 'dexie';

export interface OfflineBeneficiary {
    id?: string; // Client-side generated UUID
    offline_token: string;
    name: string;
    age: number;
    gender: string;
    date_of_registration: string;
    parent_guardian?: string;
    relationship?: string;
    beneficiary_type: string;
    status: string;
    address?: string;
    address_type?: string;
    country: string;
    state: string;
    district?: string;
    city?: string;
    pincode?: string;
    mobile_no?: string;
    purpose_of_visit: string;
    disability_type: string;
    program: string;
    donor?: string;
    economic_status: string;
    token_no?: number;
    created_at: string;
    sync_status: 'pending' | 'synced' | 'failed';
    error_message?: string;
}

export interface AppMetadata {
    key: string;
    value: any;
}

export class ROWDatabase extends Dexie {
    beneficiaries!: Table<OfflineBeneficiary>;
    metadata!: Table<AppMetadata>;

    constructor() {
        super('ROWOfflineDB');
        this.version(2).stores({
            beneficiaries: '++id, offline_token, name, sync_status, created_at',
            metadata: 'key'
        });
    }
}

export const db = new ROWDatabase();
