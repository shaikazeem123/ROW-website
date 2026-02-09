import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { History, MapPin, Calendar, Users, Plus, Download, Edit2 } from 'lucide-react';
import { exportTripsToCSV } from '@/utils/exportUtils';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import type { Trip } from '@/types/trip';

import { supabase } from '@/lib/supabase';

export function TripHistoryPage() {
    const [trips, setTrips] = useState<Trip[]>([]);
    const [filter, setFilter] = useState({
        location: '',
        month: '',
        busNumber: '',
    });

    useEffect(() => {
        loadTrips();
    }, []);

    const loadTrips = async () => {
        try {
            const { data, error } = await supabase
                .from('trips')
                .select('*')
                .order('date', { ascending: false });

            if (error) throw error;

            const mappedTrips: Trip[] = data.map((t) => ({
                id: t.id,
                date: t.date,
                busNumber: t.bus_number,
                driverName: t.driver_name,
                assistantName: t.assistant_name,
                odometerStart: t.odometer_start,
                odometerEnd: t.odometer_end,
                finalDistance: t.final_distance,
                location: t.location,
                departureTime: t.departure_time,
                returnTime: t.return_time,
                durationHours: t.duration_hours,
                purpose: t.purpose,
                beneficiariesServed: t.beneficiaries_served,
                fuelLiters: t.fuel_liters,
                fuelCost: t.fuel_cost,
                fuelEfficiency: t.fuel_efficiency,
                notes: t.notes,
                createdAt: t.created_at,
                createdBy: t.created_by,
            }));

            setTrips(mappedTrips);
        } catch (error) {
            console.error('Error loading history:', error);
        }
    };

    const getFilteredTrips = () => {
        return trips.filter(trip => {
            if (filter.location && trip.location !== filter.location) return false;
            if (filter.busNumber && trip.busNumber !== filter.busNumber) return false;
            if (filter.month) {
                const tripMonth = new Date(trip.date).toISOString().slice(0, 7);
                if (tripMonth !== filter.month) return false;
            }
            return true;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    };

    const filteredTrips = getFilteredTrips();
    const uniqueLocations = [...new Set(trips.map(t => t.location))];
    const uniqueBuses = [...new Set(trips.map(t => t.busNumber))];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
                        <History className="text-primary" size={28} />
                        Trip History
                    </h1>
                    <p className="text-text-muted">View and manage all bus trips</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={() => exportTripsToCSV(filteredTrips)}
                        disabled={filteredTrips.length === 0}
                    >
                        <Download size={18} />
                        Export
                    </Button>
                    <Link to="/tracking/add-trip">
                        <Button className="flex items-center gap-2">
                            <Plus size={18} />
                            Add Trip
                        </Button>
                    </Link>
                </div>
            </div>

            <Card>
                {/* Filters */}
                <div className="mb-6 pb-6 border-b border-gray-100">
                    <h3 className="font-semibold text-text-main mb-4">Filters</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <select
                            value={filter.location}
                            onChange={(e) => setFilter({ ...filter, location: e.target.value })}
                            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="">All Locations</option>
                            {uniqueLocations.map(loc => (
                                <option key={loc} value={loc}>{loc}</option>
                            ))}
                        </select>

                        <select
                            value={filter.busNumber}
                            onChange={(e) => setFilter({ ...filter, busNumber: e.target.value })}
                            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="">All Buses</option>
                            {uniqueBuses.map(bus => (
                                <option key={bus} value={bus}>{bus}</option>
                            ))}
                        </select>

                        <input
                            type="month"
                            value={filter.month}
                            onChange={(e) => setFilter({ ...filter, month: e.target.value })}
                            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                </div>

                {/* Summary */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-700">Total Trips</p>
                        <p className="text-2xl font-bold text-blue-900">{filteredTrips.length}</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-700">Total Distance</p>
                        <p className="text-2xl font-bold text-green-900">
                            {filteredTrips.reduce((sum, t) => sum + t.finalDistance, 0)} km
                        </p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <p className="text-sm text-purple-700">Beneficiaries</p>
                        <p className="text-2xl font-bold text-purple-900">
                            {filteredTrips.reduce((sum, t) => sum + t.beneficiariesServed, 0)}
                        </p>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <p className="text-sm text-orange-700">Fuel Cost</p>
                        <p className="text-2xl font-bold text-orange-900">
                            ₹{filteredTrips.reduce((sum, t) => sum + (t.fuelCost || 0), 0).toLocaleString()}
                        </p>
                    </div>
                </div>

                {/* Trips Table */}
                {filteredTrips.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50">
                                    <th className="text-left p-3 text-sm font-semibold text-text-main">Date</th>
                                    <th className="text-left p-3 text-sm font-semibold text-text-main">Location</th>
                                    <th className="text-left p-3 text-sm font-semibold text-text-main">Bus</th>
                                    <th className="text-right p-3 text-sm font-semibold text-text-main">Distance</th>
                                    <th className="text-right p-3 text-sm font-semibold text-text-main">Duration</th>
                                    <th className="text-right p-3 text-sm font-semibold text-text-main">Beneficiaries</th>
                                    <th className="text-right p-3 text-sm font-semibold text-text-main">Fuel</th>
                                    <th className="text-right p-3 text-sm font-semibold text-text-main">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTrips.map((trip, index) => (
                                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="p-3 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="text-gray-400" />
                                                {new Date(trip.date).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="p-3 text-sm">
                                            <div className="flex items-center gap-2">
                                                <MapPin size={14} className="text-primary" />
                                                <span className="font-medium">{trip.location}</span>
                                            </div>
                                        </td>
                                        <td className="p-3 text-sm text-text-muted">{trip.busNumber}</td>
                                        <td className="p-3 text-sm text-right font-medium">{trip.finalDistance} km</td>
                                        <td className="p-3 text-sm text-right text-text-muted">
                                            {trip.durationHours.toFixed(1)}h
                                        </td>
                                        <td className="p-3 text-sm text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Users size={14} className="text-purple-500" />
                                                {trip.beneficiariesServed}
                                            </div>
                                        </td>
                                        <td className="p-3 text-sm text-right text-text-muted">
                                            {trip.fuelEfficiency ? `${trip.fuelEfficiency} km/L` : '--'}
                                        </td>
                                        <td className="p-3 text-sm text-right">
                                            <Link to={`/tracking/edit-trip/${trip.id}`}>
                                                <Button variant="outline" className="p-2 h-auto text-primary hover:bg-primary/5">
                                                    <Edit2 size={14} />
                                                </Button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <History size={48} className="mx-auto text-gray-300 mb-3" />
                        <p className="text-text-muted mb-4">No trips found matching your filters</p>
                        <Button onClick={() => setFilter({ location: '', month: '', busNumber: '' })} variant="outline">
                            Clear Filters
                        </Button>
                    </div>
                )}
            </Card>
        </div>
    );
}
