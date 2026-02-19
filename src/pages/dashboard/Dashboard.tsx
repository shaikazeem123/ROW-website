import {
    Users,
    Bus,
    MapPin,
    TrendingUp,
    Stethoscope,
    ArrowUpRight,
    Bell,
    ArrowRight,
    Filter
} from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { getEventsByMonth } from '@/data/screeningSchedule';
import { Link } from 'react-router-dom';
import { BeneficiaryRegistrationChart } from '@/components/dashboard/BeneficiaryRegistrationChart';
import { ServiceDashboardChart } from '@/components/dashboard/ServiceDashboardChart';
import type { TimeFrame, ChartFilter } from '@/types/dashboard';


interface MappedCamp {
    location: string;
    date: string;
    type: string;
}

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function DashboardPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [dynamicStats, setDynamicStats] = useState({
        totalBeneficiaries: 0,
        activeBuses: 0,
        campsConducted: 0,
        servicesProvided: 0
    });

    const [upcomingCamps, setUpcomingCamps] = useState<MappedCamp[]>([]);

    // Global Filter State
    const [timeframe, setTimeframe] = useState<TimeFrame>('all');
    const [globalFilter, setGlobalFilter] = useState<ChartFilter>({
        startDate: '',
        endDate: '',
    });

    // Helper to set dates based on timeframe
    const handleTimeframeChange = (t: TimeFrame) => {
        setTimeframe(t);
        const today = new Date();
        let start = '';
        const end = today.toISOString().split('T')[0];

        if (t === 'daily') {
            start = end;
        } else if (t === 'monthly') {
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
            start = firstDay.toISOString().split('T')[0];
        } else if (t === 'yearly') {
            const firstDayYear = new Date(today.getFullYear(), 0, 1);
            start = firstDayYear.toISOString().split('T')[0];
        } else {
            // 'all'
            start = '';
            setGlobalFilter({ startDate: '', endDate: '' });
            return;
        }
        setGlobalFilter({ ...globalFilter, startDate: start, endDate: end });
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            setIsLoading(true);
            try {
                // 1. Fetch registered beneficiaries in period
                let bQuery = supabase
                    .from('beneficiaries')
                    .select('*', { count: 'exact', head: true });

                if (globalFilter.startDate) bQuery = bQuery.gte('date_of_registration', globalFilter.startDate);
                if (globalFilter.endDate) bQuery = bQuery.lte('date_of_registration', globalFilter.endDate);

                const { count: beneficiaryCount, error: bError } = await bQuery;
                if (bError) throw bError;

                // 2. Fetch stats from 'trips' table in period
                let tQuery = supabase
                    .from('trips')
                    .select('bus_number');

                if (globalFilter.startDate) tQuery = tQuery.gte('date', globalFilter.startDate);
                if (globalFilter.endDate) tQuery = tQuery.lte('date', globalFilter.endDate);

                const { data: trips, error: tError } = await tQuery;
                if (tError) throw tError;

                // 3. Fetch total services provided in period
                let sQuery = supabase
                    .from('services')
                    .select('*', { count: 'exact', head: true });

                if (globalFilter.startDate) sQuery = sQuery.gte('service_date', globalFilter.startDate);
                if (globalFilter.endDate) sQuery = sQuery.lte('service_date', globalFilter.endDate);

                const { count: servicesCount, error: srvError } = await sQuery;
                if (srvError) throw srvError;


                const uniqueBuses = trips ? new Set(trips.map(t => t.bus_number)).size : 0;
                const campsConducted = trips ? trips.length : 0;

                setDynamicStats({
                    totalBeneficiaries: beneficiaryCount || 0,
                    activeBuses: uniqueBuses,
                    campsConducted,
                    servicesProvided: servicesCount || 0
                });

                // 4. Fetch upcoming camps from monthly_schedules (This usually stays independent of history filter)
                const currentDate = new Date();
                const { data: schedules, error: sError } = await supabase
                    .from('monthly_schedules')
                    .select('*')
                    .eq('is_active', true)
                    .gte('scheduled_date', currentDate.toISOString().split('T')[0])
                    .order('scheduled_date', { ascending: true })
                    .limit(4);

                if (sError) throw sError;

                if (schedules) {
                    const mappedCamps: MappedCamp[] = schedules.map(camp => ({
                        location: camp.location_name,
                        date: new Date(camp.scheduled_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                        type: camp.status === 'completed' ? 'Completed' : 'Screening Camp'
                    }));
                    setUpcomingCamps(mappedCamps);
                }

            } catch (err) {
                console.error('Error fetching dashboard stats:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, [globalFilter]);

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
            label: 'Services Provided',
            value: dynamicStats.servicesProvided.toLocaleString(),
            icon: Stethoscope,
            change: 'Lifetime',
            color: 'text-orange-600',
            bg: 'bg-orange-50',
            link: '/services/history'
        },
    ];

    // Get current month screening events
    const today = new Date();
    const currentMonthEvents = getEventsByMonth(today.getFullYear(), today.getMonth() + 1);
    const screeningEvents = currentMonthEvents.filter(event => event.eventType === 'screening');
    const hasScreenings = screeningEvents.length > 0;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Global Filters Section */}
            <Card className="p-4 bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Filter size={18} className="text-gray-400" />
                        <span className="text-sm font-bold text-gray-700 uppercase tracking-wider">Date Filters</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        {/* Timeframe Presets */}
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            {(['daily', 'monthly', 'yearly', 'all'] as const).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => handleTimeframeChange(t)}
                                    className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${timeframe === t
                                        ? 'bg-white text-primary shadow-sm'
                                        : 'text-gray-500 hover:text-gray-900'
                                        }`}
                                >
                                    {t === 'daily' ? 'Day Wise' : t === 'monthly' ? 'Month Wise' : t === 'yearly' ? 'Year Wise' : 'Whole Data'}
                                </button>
                            ))}
                        </div>

                        {/* Custom Date Range Picker */}
                        <div className="flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-bold text-gray-400 uppercase">From</span>
                                <input
                                    type="date"
                                    value={globalFilter.startDate}
                                    onChange={(e) => setGlobalFilter({ ...globalFilter, startDate: e.target.value })}
                                    className="bg-transparent border-none p-0 text-xs font-semibold focus:ring-0"
                                />
                            </div>
                            <span className="text-gray-300">|</span>
                            <div className="flex flex-col">
                                <span className="text-[9px] font-bold text-gray-400 uppercase">To</span>
                                <input
                                    type="date"
                                    value={globalFilter.endDate}
                                    onChange={(e) => setGlobalFilter({ ...globalFilter, endDate: e.target.value })}
                                    className="bg-transparent border-none p-0 text-xs font-semibold focus:ring-0"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Header Section (Removed extra select date button as we have global filter) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-main">Dashboard Overview</h1>
                    <p className="text-text-muted">Welcome back, Admin. Here's what's happening today.</p>
                </div>
                <div className="flex gap-3">
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
                {/* Charts Area */}
                <div className="lg:col-span-2 space-y-6">
                    <BeneficiaryRegistrationChart timeframe={timeframe} filter={globalFilter} />
                    <ServiceDashboardChart timeframe={timeframe} filter={globalFilter} />
                </div>

                {/* Side Panel: Scheduled Camps */}
                <div className="space-y-6">
                    <Card>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-lg text-text-main">Upcoming Camps</h3>
                            <Link to="/tracking#upcoming-camps" className="text-xs text-primary font-medium hover:underline flex items-center">
                                View All <ArrowUpRight size={12} className="ml-1" />
                            </Link>
                        </div>
                        <div className="space-y-4">
                            {upcomingCamps.map((camp: MappedCamp, i: number) => (
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
