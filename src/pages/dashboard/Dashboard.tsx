import {
    Users,
    Bus,
    MapPin,
    Calendar,
    TrendingUp,
    Activity,
    ArrowUpRight,
    Bell,
    ArrowRight
} from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { screeningSchedule, getEventsByMonth } from '@/data/screeningSchedule';
import { Link } from 'react-router-dom';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function DashboardPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [dynamicStats, setDynamicStats] = useState({
        totalBeneficiaries: 0,
        activeBuses: 0,
        campsConducted: 0,
        pendingServices: 0
    });

    useEffect(() => {
        const fetchDashboardData = async () => {
            setIsLoading(true);
            try {
                // 1. Fetch total registered beneficiaries
                const { count: beneficiaryCount, error: bError } = await supabase
                    .from('beneficiaries')
                    .select('*', { count: 'exact', head: true });

                if (bError) throw bError;

                // 2. Fetch stats from 'trips' table
                const { data: trips, error: tError } = await supabase
                    .from('trips')
                    .select('bus_number');

                if (tError) throw tError;

                if (trips) {
                    const uniqueBuses = new Set(trips.map(t => t.bus_number)).size;
                    const campsConducted = trips.length;

                    setDynamicStats({
                        totalBeneficiaries: beneficiaryCount || 0,
                        activeBuses: uniqueBuses,
                        campsConducted,
                        pendingServices: 0
                    });
                }
            } catch (err) {
                console.error('Error fetching dashboard stats:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const stats = [
        {
            label: 'Total Beneficiaries',
            value: dynamicStats.totalBeneficiaries.toLocaleString(),
            icon: Users,
            change: '+0%',
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            link: '/beneficiary/list'
        },
        {
            label: 'Active Buses',
            value: dynamicStats.activeBuses.toString(),
            icon: Bus,
            change: 'Online',
            color: 'text-green-600',
            bg: 'bg-green-50',
            link: '/tracking'
        },
        {
            label: 'Camps Conducted',
            value: dynamicStats.campsConducted.toString(),
            icon: MapPin,
            change: 'Lifetime',
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            link: '/tracking/history'
        },
        {
            label: 'Pending Services',
            value: dynamicStats.pendingServices.toString(),
            icon: Activity,
            change: 'To do',
            color: 'text-orange-600',
            bg: 'bg-orange-50',
            link: '/services/history'
        },
    ];

    const upcomingCamps = screeningSchedule
        .filter((event: any) => new Date(event.date) >= new Date())
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 3)
        .map((event: any) => ({
            location: event.location,
            date: new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            type: event.purpose === 'Follow-up Session' ? 'Follow-up' : 'Screening'
        }));

    // Get current month screening events
    const today = new Date();
    const currentMonthEvents = getEventsByMonth(today.getFullYear(), today.getMonth() + 1);
    const screeningEvents = currentMonthEvents.filter(event => event.eventType === 'screening');
    const hasScreenings = screeningEvents.length > 0;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-main">Dashboard Overview</h1>
                    <p className="text-text-muted">Welcome back, Admin. Here's what's happening today.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="flex items-center gap-2">
                        <Calendar size={18} /> Select Date
                    </Button>
                    <Button className="flex items-center gap-2">
                        Download Report
                    </Button>
                </div>
            </div>

            {/* Screening Notification Banner */}
            {hasScreenings && (
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-500 rounded-lg shrink-0">
                            <Bell className="text-white" size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-blue-900 mb-1 flex items-center gap-2">
                                Screening Assessment This Month
                            </h3>
                            <p className="text-sm text-blue-700 mb-3">
                                {screeningEvents.length} screening {screeningEvents.length === 1 ? 'session' : 'sessions'} scheduled for the first 5 days •
                                {' '}Locations: {screeningEvents.slice(0, 3).map(e => e.location).join(', ')}
                                {screeningEvents.length > 3 && ` +${screeningEvents.length - 3} more`}
                            </p>
                            <Link to="/calendar">
                                <Button variant="secondary" className="text-sm flex items-center gap-2 bg-white hover:bg-blue-50 text-blue-700">
                                    View Full Calendar <ArrowRight size={16} />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <Link key={index} to={stat.link} className="block group">
                        <Card className="p-4 border-l-4 border-l-primary hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1 cursor-pointer h-full">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-text-muted mb-1 group-hover:text-primary transition-colors">{stat.label}</p>
                                    {isLoading ? (
                                        <div className="h-8 w-24 bg-gray-100 animate-pulse rounded"></div>
                                    ) : (
                                        <h3 className="text-2xl font-bold text-text-main">{stat.value}</h3>
                                    )}
                                </div>
                                <div className={`p-2 rounded-lg ${stat.bg} group-hover:scale-110 transition-transform`}>
                                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center justify-between">
                                <div className="flex items-center text-xs font-medium text-green-600">
                                    <TrendingUp size={14} className="mr-1" />
                                    {stat.change}
                                    <span className="text-text-muted ml-2 font-normal">vs last month</span>
                                </div>
                                <ArrowRight size={14} className="text-primary opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                            </div>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Main Content Areas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart Area Placeholder */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="min-h-[300px] flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-semibold text-lg text-text-main flex items-center gap-2">
                                <Activity className="text-primary" size={20} />
                                Service Impact Analytics
                            </h3>
                            <select className="text-sm border-gray-200 rounded-lg p-1 bg-gray-50 text-text-muted">
                                <option>Last 30 Days</option>
                                <option>Last 6 Months</option>
                            </select>
                        </div>
                        <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-3 animate-pulse"></div>
                                <p className="text-text-muted">Impact Chart Visualization Loading...</p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Side Panel: Scheduled Camps */}
                <div className="space-y-6">
                    <Card>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-lg text-text-main">Upcoming Camps</h3>
                            <a href="#" className="text-xs text-primary font-medium hover:underline flex items-center">
                                View All <ArrowUpRight size={12} className="ml-1" />
                            </a>
                        </div>
                        <div className="space-y-4">
                            {upcomingCamps.map((camp: any, i: number) => (
                                <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 cursor-pointer">
                                    <div className="flex flex-col items-center justify-center w-12 h-12 bg-primary/10 text-primary rounded-lg shrink-0">
                                        <span className="text-xs font-bold">{camp.date.split(' ')[0]}</span>
                                        <span className="text-lg font-bold leading-none">{camp.date.split(' ')[1].replace(',', '')}</span>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-text-main text-sm">{camp.location}</h4>
                                        <p className="text-xs text-text-muted mt-1">{camp.type}</p>
                                        <div className="flex items-center mt-2 text-xs text-text-muted">
                                            <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span> Confirmed
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Button variant="secondary" className="w-full mt-4 text-sm">Schedule New Camp</Button>
                    </Card>
                </div>
            </div>
        </div>
    );
}
