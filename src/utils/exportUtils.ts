import type { Trip } from '@/types/trip';

/**
 * Converts an array of objects to CSV string
 */
export function convertToCSV(data: Record<string, unknown>[], headers: { key: string; label: string }[]): string {
    const headerRow = headers.map(h => `"${h.label}"`).join(',');
    const rows = data.map(item => {
        return headers.map(h => {
            const value = item[h.key];
            const displayValue = value === undefined || value === null ? '' : value;
            return `"${displayValue.toString().replace(/"/g, '""')}"`;
        }).join(',');
    });
    return [headerRow, ...rows].join('\n');
}

/**
 * Triggers a browser download of a CSV file
 */
export function downloadCSV(csvContent: string, fileName: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

/**
 * Formats and exports trip data to CSV
 */
export function exportTripsToCSV(trips: Trip[]): void {
    const headers = [
        { key: 'date', label: 'Date' },
        { key: 'location', label: 'Location' },
        { key: 'busNumber', label: 'Bus Number' },
        { key: 'driverName', label: 'Driver' },
        { key: 'assistantName', label: 'Assistant' },
        { key: 'purpose', label: 'Purpose' },
        { key: 'finalDistance', label: 'Distance (km)' },
        { key: 'durationHours', label: 'Duration (h)' },
        { key: 'beneficiariesServed', label: 'Beneficiaries' },
        { key: 'fuelLiters', label: 'Fuel (L)' },
        { key: 'fuelCost', label: 'Fuel Cost (₹)' },
        { key: 'fuelEfficiency', label: 'Efficiency (km/L)' },
        { key: 'notes', label: 'Notes' },
    ];

    // Format dates and decimal values for export
    const formattedData = trips.map(trip => ({
        ...trip,
        date: new Date(trip.date).toLocaleDateString(),
        durationHours: trip.durationHours.toFixed(2),
        fuelEfficiency: trip.fuelEfficiency?.toFixed(2) || 'N/A',
    }));

    const csvContent = convertToCSV(formattedData, headers);
    const fileName = `ROW_Trip_Export_${new Date().toISOString().split('T')[0]}.csv`;

    downloadCSV(csvContent, fileName);
}
