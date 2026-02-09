import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = import.meta.env.VITE_OFFLINE_SECRET || 'row-outreach-default-secret';

export const OfflineStorage = {
    encrypt: (data: any) => {
        return CryptoJS.AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString();
    },

    decrypt: (ciphertext: string) => {
        const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
        return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    },

    generateOfflineToken: (locationCode: string, sequence: number) => {
        const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const seqStr = String(sequence).padStart(4, '0');
        return `${locationCode}-${date}-${seqStr}`;
    }
};
