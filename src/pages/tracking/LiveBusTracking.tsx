import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    Bus,
    Plus,
    TrendingUp,
    MapPin,
    Fuel,
    Users,
    Calendar,
    BarChart3,
    Download
} from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import type { Trip, TripSummary } from '@/types/trip';
import { clearTripData } from '@/data/tripData';
import { exportTripsToCSV } from '@/utils/exportUtils';

import { supabase } from '@/lib/supabase';
import { BusMap } from '@/components/tracking/BusMap';

interface MonthlySchedule {
    id: string;
    location_name: string;
    scheduled_date: string;
    address?: string;
    status?: string;
    is_active: boolean;
}

export function LiveBusTrackingPage() {
    const [trips, setTrips] = useState<Trip[]>([]);
    const [monthlyStats, setMonthlyStats] = useState<TripSummary | null>(null);
    const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly' | 'custom' | 'all'>('all');
    const [customDateRange, setCustomDateRange] = useState({
        start: new Date().toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });
    const [upcomingCamps, setUpcomingCamps] = useState<MonthlySchedule[]>([]);

    const getFilteredTrips = useCallback(() => {
        const now = new Date();
        return trips.filter(trip => {
            const tripDate = new Date(trip.date);
            if (timeframe === 'daily') {
                return tripDate.toDateString() === now.toDateString();
            }
            if (timeframe === 'weekly') {
                const weekAgo = new Date();
                weekAgo.setDate(now.getDate() - 7);
                return tripDate >= weekAgo;
            }
            if (timeframe === 'monthly') {
                return tripDate.getMonth() === now.getMonth() && tripDate.getFullYear() === now.getFullYear();
            }
            if (timeframe === 'custom') {
                const start = new Date(customDateRange.start);
                const end = new Date(customDateRange.end);
                // Set end time to end of day to include trips on that day
                end.setHours(23, 59, 59, 999);
                return tripDate >= start && tripDate <= end;
            }
            return true; // 'all'
        });
    }, [trips, timeframe, customDateRange]);

    const calculateStats = useCallback(() => {
        const filtered = getFilteredTrips();

        if (filtered.length === 0) {
            setMonthlyStats({
                totalDistance: 0,
                totalTrips: 0,
                operatingDays: 0,
                averageDistance: 0,
                totalBeneficiaries: 0,
                totalFuelCost: 0,
                averageFuelEfficiency: 0,
                locationsCovered: 0,
            });
            return;
        }

        const totalDistance = filtered.reduce((sum, trip) => sum + trip.finalDistance, 0);
        const totalBeneficiaries = filtered.reduce((sum, trip) => sum + trip.beneficiariesServed, 0);
        const totalFuelCost = filtered.reduce((sum, trip) => sum + (trip.fuelCost || 0), 0);

        const tripsWithFuel = filtered.filter(t => t.fuelEfficiency);
        const averageFuelEfficiency = tripsWithFuel.length > 0
            ? tripsWithFuel.reduce((sum, t) => sum + (t.fuelEfficiency || 0), 0) / tripsWithFuel.length
            : 0;

        const uniqueDates = new Set(filtered.map(t => t.date));
        const uniqueLocations = new Set(filtered.map(t => t.location));

        setMonthlyStats({
            totalDistance: Math.round(totalDistance),
            totalTrips: filtered.length,
            operatingDays: uniqueDates.size,
            averageDistance: Math.round(totalDistance / filtered.length),
            totalBeneficiaries,
            totalFuelCost: Math.round(totalFuelCost),
            averageFuelEfficiency: Number(averageFuelEfficiency.toFixed(2)),
            locationsCovered: uniqueLocations.size,
        });
    }, [getFilteredTrips]);

    useEffect(() => {
        loadTrips();
        loadUpcomingCamps();
    }, []);

    useEffect(() => {
        calculateStats();
    }, [calculateStats]);

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
            console.error('Error loading trips:', error);
        }
    };

    const loadUpcomingCamps = async () => {
        try {
            const currentDate = new Date();

            const { data, error } = await supabase
                .from('monthly_schedules')
                .select('*')
                .eq('is_active', true)
                .gte('scheduled_date', currentDate.toISOString().split('T')[0])
                .order('scheduled_date', { ascending: true })
                .limit(10);

            if (error) throw error;

            setUpcomingCamps(data || []);
        } catch (error) {
            console.error('Error loading camps:', error);
        }
    };


    // Get location visit breakdown based on filtered trips
    const getLocationStats = () => {
        const filtered = getFilteredTrips();
        const locationMap: Record<string, { visits: number; distance: number }> = {};

        filtered.forEach(trip => {
            if (!locationMap[trip.location]) {
                locationMap[trip.location] = { visits: 0, distance: 0 };
            }
            locationMap[trip.location].visits++;
            locationMap[trip.location].distance += trip.finalDistance;
        });

        return Object.entries(locationMap)
            .map(([location, data]) => ({ location, ...data }))
            .sort((a, b) => b.visits - a.visits);
    };

    // Get recent trips
    const getRecentTrips = () => {
        return [...getFilteredTrips()]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);
    };

    const stats = monthlyStats || {
        totalDistance: 0,
        totalTrips: 0,
        operatingDays: 0,
        averageDistance: 0,
        totalBeneficiaries: 0,
        totalFuelCost: 0,
        averageFuelEfficiency: 0,
        locationsCovered: 0,
    };

    const locationStats = getLocationStats();
    const recentTrips = getRecentTrips();

    const handleClearData = () => {
        if (confirm('Are you sure you want to clear all trip data?')) {
            clearTripData();
            loadTrips();
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
                        <Bus className="text-primary" size={28} />
                        Bus Tracking Dashboard
                    </h1>
                    <p className="text-text-muted">
                        {timeframe === 'monthly' ? `Analytics for ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}` :
                            timeframe === 'weekly' ? 'Analytics for the last 7 days' :
                                timeframe === 'daily' ? 'Analytics for today' : 'Overall lifetime analytics'}
                    </p>
                </div>
                <div className="flex flex-wrap gap-4 items-center">
                    {/* Timeframe Selection */}
                    <div className="flex flex-col gap-2">
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            {(['daily', 'weekly', 'monthly', 'custom', 'all'] as const).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTimeframe(t)}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${timeframe === t
                                        ? 'bg-white text-primary shadow-sm'
                                        : 'text-text-muted hover:text-text-main'
                                        }`}
                                >
                                    {t === 'daily' ? 'Day' : t.charAt(0).toUpperCase() + t.slice(1)}
                                </button>
                            ))}
                        </div>

                        {timeframe === 'custom' && (
                            <div className="flex items-center gap-2 animate-in slide-in-from-top-2 duration-300">
                                <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-md px-2 py-1">
                                    <span className="text-[10px] text-text-muted uppercase font-bold">From:</span>
                                    <input
                                        type="date"
                                        className="text-xs focus:outline-none"
                                        value={customDateRange.start}
                                        onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                                    />
                                </div>
                                <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-md px-2 py-1">
                                    <span className="text-[10px] text-text-muted uppercase font-bold">To:</span>
                                    <input
                                        type="date"
                                        className="text-xs focus:outline-none"
                                        value={customDateRange.end}
                                        onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2">
                        {getFilteredTrips().length > 0 && (
                            <Button
                                variant="outline"
                                onClick={() => exportTripsToCSV(getFilteredTrips())}
                                className="flex items-center gap-2"
                            >
                                <Download size={16} />
                                Export
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            onClick={handleClearData}
                            className="flex items-center gap-2 text-red-600 hover:bg-red-50 border-red-100"
                        >
                            🗑️
                        </Button>
                        <Link to="/tracking/add-trip">
                            <Button className="flex items-center gap-2">
                                <Plus size={16} />
                                Add Trip
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>


            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4 border-l-4 border-l-blue-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-text-muted mb-1">Total Distance</p>
                            <h3 className="text-2xl font-bold text-text-main">{stats.totalDistance} km</h3>
                        </div>
                        <div className="p-2 rounded-lg bg-blue-50">
                            <TrendingUp className="w-5 h-5 text-blue-600" />
                        </div>
                    </div>
                    <p className="text-xs text-text-muted mt-2">
                        Avg: {stats.averageDistance} km/trip
                    </p>
                </Card>

                <Card className="p-4 border-l-4 border-l-green-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-text-muted mb-1">Operating Days</p>
                            <h3 className="text-2xl font-bold text-text-main">{stats.operatingDays}</h3>
                        </div>
                        <div className="p-2 rounded-lg bg-green-50">
                            <Calendar className="w-5 h-5 text-green-600" />
                        </div>
                    </div>
                    <p className="text-xs text-text-muted mt-2">
                        {stats.totalTrips} total trips
                    </p>
                </Card>

                <Card className="p-4 border-l-4 border-l-purple-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-text-muted mb-1">Beneficiaries</p>
                            <h3 className="text-2xl font-bold text-text-main">{stats.totalBeneficiaries}</h3>
                        </div>
                        <div className="p-2 rounded-lg bg-purple-50">
                            <Users className="w-5 h-5 text-purple-600" />
                        </div>
                    </div>
                    <p className="text-xs text-text-muted mt-2">
                        {stats.locationsCovered} locations
                    </p>
                </Card>

                <Card className="p-4 border-l-4 border-l-orange-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-text-muted mb-1">Fuel Efficiency</p>
                            <h3 className="text-2xl font-bold text-text-main">
                                {stats.averageFuelEfficiency > 0 ? stats.averageFuelEfficiency : '--'} <span className="text-sm">km/L</span>
                            </h3>
                        </div>
                        <div className="p-2 rounded-lg bg-orange-50">
                            <Fuel className="w-5 h-5 text-orange-600" />
                        </div>
                    </div>
                    <p className="text-xs text-text-muted mt-2">
                        Cost: ₹{stats.totalFuelCost.toLocaleString()}
                    </p>
                </Card>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Location Coverage */}
                <Card className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-lg text-text-main flex items-center gap-2">
                            <MapPin className="text-primary" size={20} />
                            Location Coverage
                        </h3>
                        <Link to="/tracking/history">
                            <Button variant="outline" className="text-sm">
                                View All
                            </Button>
                        </Link>
                    </div>

                    {locationStats.length > 0 ? (
                        <div className="space-y-4">
                            {locationStats.map((loc, index) => (
                                <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                        <span className="text-primary font-bold">{loc.visits}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-text-main truncate">{loc.location}</h4>
                                        <p className="text-sm text-text-muted">
                                            {loc.distance} km total • {loc.visits} visits
                                        </p>
                                    </div>
                                    <div className="w-24">
                                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary rounded-full"
                                                style={{
                                                    width: `${(loc.visits / Math.max(...locationStats.map(l => l.visits))) * 100}%`
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <MapPin size={48} className="mx-auto text-gray-300 mb-3" />
                            <p className="text-text-muted">No trips recorded this month</p>
                            <Link to="/tracking/add-trip">
                                <Button className="mt-4 flex items-center gap-2 mx-auto">
                                    <Plus size={16} />
                                    Add Your First Trip
                                </Button>
                            </Link>
                        </div>
                    )}

                    {/* Map placed under location details */}
                    <div className="mt-8 border-t border-gray-100 pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold text-text-main flex items-center gap-2">
                                <MapPin className="text-primary" size={18} />
                                Area Coverage Map
                            </h4>
                            <span className="text-xs text-text-muted">
                                {getFilteredTrips().length} points of interest
                            </span>
                        </div>
                        <BusMap trips={getFilteredTrips()} />
                    </div>
                </Card>

                {/* Recent Trips */}
                <Card>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-lg text-text-main flex items-center gap-2">
                            <BarChart3 className="text-primary" size={20} />
                            Recent Trips
                        </h3>
                    </div>

                    {recentTrips.length > 0 ? (
                        <div className="space-y-3">
                            {recentTrips.map((trip, index) => (
                                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-medium text-primary">
                                            {new Date(trip.date).toLocaleDateString()}
                                        </span>
                                        <span className="text-xs text-text-muted">{trip.busNumber}</span>
                                    </div>
                                    <h4 className="font-medium text-sm text-text-main">{trip.location}</h4>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-text-muted">
                                        <span>{trip.finalDistance} km</span>
                                        <span>•</span>
                                        <span>{trip.beneficiariesServed} people</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-text-muted text-sm">No trips yet</p>
                        </div>
                    )}
                </Card>

                {/* Upcoming Camps - Current Month */}
                <Card className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-lg text-text-main flex items-center gap-2">
                            <Calendar className="text-primary" size={20} />
                            Upcoming Camps
                        </h3>
                    </div>

                    {upcomingCamps.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {upcomingCamps.map((camp, index) => (
                                <div key={index} className={`p-3 border rounded-lg ${camp.status === 'completed'
                                    ? 'bg-green-50 border-green-200'
                                    : 'bg-blue-50 border-blue-100'
                                    }`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold uppercase" style={{
                                            color: camp.status === 'completed' ? '#166534' : '#1e3a8a'
                                        }}>
                                            {new Date(camp.scheduled_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${camp.status === 'completed'
                                            ? 'text-green-700 bg-green-100'
                                            : 'text-blue-600 bg-blue-100'
                                            }`}>
                                            {camp.status === 'completed' ? '✓ Completed' : 'Scheduled'}
                                        </span>
                                    </div>
                                    <h4 className="font-semibold text-sm text-blue-900 mb-1">
                                        <MapPin className="inline w-3 h-3 mr-1" />
                                        {camp.location_name}
                                    </h4>
                                    {camp.address && (
                                        <p className="text-xs text-blue-700 line-clamp-2">
                                            {camp.address}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                            <Calendar size={32} className="mx-auto text-gray-300 mb-2" />
                            <p className="text-text-muted text-sm">No upcoming camps scheduled</p>
                            <p className="text-xs text-text-muted mt-1">Upload monthly schedule in Admin Control</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
