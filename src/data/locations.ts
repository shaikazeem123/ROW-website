import type { Location } from '@/types/trip';

/**
 * Base location for distance calculations
 */
export const BASE_LOCATION: Location = {
    id: 'base',
    name: 'ROW Base Office',
    address: '6th Cross Road, Horamavu Agara Road, Off, Hutchins Rd, St Thomas Town, Lingarajapuram, Bengaluru, Karnataka 560084',
    coordinates: {
        lat: 13.0051,
        lng: 77.6233
    }
};

/**
 * Pre-defined screening and service locations
 */
export const LOCATIONS: Location[] = [
    {
        id: 'chanrayapatna',
        name: 'Chanrayapatna',
        address: 'Chanrayapatna, Hassan District, Karnataka',
        coordinates: {
            lat: 12.9199,
            lng: 76.3895
        },
        standardDistance: 170 // km round trip
    },
    {
        id: 'hesarghatta',
        name: 'Hesarghatta',
        address: 'Hesarghatta, Bangalore Rural, Karnataka',
        coordinates: {
            lat: 13.1419,
            lng: 77.4758
        },
        standardDistance: 84 // km round trip
    },
    {
        id: 'nalur',
        name: 'Nalur',
        address: 'Nalur, Bangalore, Karnataka',
        coordinates: {
            lat: 13.0500,
            lng: 77.7000
        },
        standardDistance: 134 // km round trip
    },
    {
        id: 'shanti-nagar',
        name: 'Shanti Nagar - TBD',
        address: 'Shanti Nagar, Bangalore, Karnataka',
        coordinates: {
            lat: 12.9698,
            lng: 77.6173
        },
        standardDistance: 56 // km round trip
    },
    {
        id: 'sonnenahalli',
        name: 'Sonnenahalli',
        address: 'Sonnenahalli, Bangalore, Karnataka',
        coordinates: {
            lat: 13.0192,
            lng: 77.6408
        },
        standardDistance: 76 // km round trip
    }
];

/**
 * Get location by name
 */
export function getLocationByName(name: string): Location | undefined {
    return LOCATIONS.find(loc => loc.name.toLowerCase() === name.toLowerCase());
}

/**
 * Get location by ID
 */
export function getLocationById(id: string): Location | undefined {
    return LOCATIONS.find(loc => loc.id === id);
}

/**
 * Get all location names for dropdown
 */
export function getLocationNames(): string[] {
    return LOCATIONS.map(loc => loc.name);
}
