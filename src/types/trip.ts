export type TripPurpose = 'Screening' | 'Follow-up' | 'Maintenance' | 'Emergency' | 'Other';
export type BusStatus = 'Active' | 'Idle' | 'Maintenance' | 'Inactive';

export interface Trip {
    id: string;
    date: string; // ISO date format
    busNumber: string;
    driverName: string;
    assistantName?: string;

    // Distance tracking
    odometerStart?: number;
    odometerEnd?: number;
    calculatedDistance?: number; // From odometer
    locationDistance?: number; // From Google Maps
    finalDistance: number; // Used for calculations

    // Location
    location: string;
    locationCoordinates?: {
        lat: number;
        lng: number;
    };

    // Time
    departureTime: string;
    returnTime: string;
    durationHours: number;

    // Purpose & Impact
    purpose: TripPurpose;
    beneficiariesServed: number;

    // Fuel & Cost
    fuelLiters?: number;
    fuelCost?: number;
    fuelEfficiency?: number; // km/L

    // Generator
    generatorStartReading?: number;
    generatorEndReading?: number;
    generatorUnitsUsed?: number; // End - Start

    // Additional
    notes?: string;
    stopsOrDelays?: string;

    // Meta
    createdBy: string;
    createdAt: string;
    updatedAt?: string;
}

export interface Location {
    id: string;
    name: string;
    address: string;
    coordinates: {
        lat: number;
        lng: number;
    };
    standardDistance?: number; // Fallback if API fails
}

export interface TripSummary {
    totalDistance: number;
    totalTrips: number;
    operatingDays: number;
    averageDistance: number;
    totalBeneficiaries: number;
    totalFuelCost: number;
    totalFuelLiters: number;
    averageFuelEfficiency: number;
    locationsCovered: number;
}

export interface MonthlyStats {
    month: string;
    year: number;
    summary: TripSummary;
    tripsByLocation: Record<string, number>;
    distanceByLocation: Record<string, number>;
}
