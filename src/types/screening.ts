export type EventType = 'screening' | 'followup';

export interface ScreeningEvent {
    id: string;
    date: string; // ISO date format (YYYY-MM-DD)
    location: string;
    contactPerson: string;
    contactPhone?: string;
    timeIn: string; // e.g., "9:15"
    timeOut: string; // e.g., "17:00"
    purpose: string;
    eventType: EventType;
    followUpNumber?: number; // 1, 2, or 3 for follow-up sessions
}
