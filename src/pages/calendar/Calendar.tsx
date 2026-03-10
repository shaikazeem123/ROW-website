import { useState, useEffect } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    MapPin,
    User,
    Clock,
    X,
    Bus,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Users,
    ArrowRight
} from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Link } from 'react-router-dom';
import { fetchCalendarEvents, type CalendarEvent } from '@/services/calendarService';

// Status color config
const STATUS_STYLES: Record<CalendarEvent['status'], { bg: string; text: string; border: string; label: string; icon: typeof CheckCircle }> = {
    scheduled: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-l-blue-500', label: 'Scheduled', icon: CalendarIcon },
    completed: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-l-green-500', label: 'Completed', icon: CheckCircle },
    cancelled: { bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-l-gray-400', label: 'Cancelled', icon: XCircle },
    missed: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-l-red-500', label: 'Missed', icon: AlertTriangle },
};

const EVENT_TYPE_COLORS: Record<CalendarEvent['eventType'], { bg: string; text: string }> = {
    'screening': { bg: 'bg-blue-100', text: 'text-blue-700' },
    'follow-up': { bg: 'bg-green-100', text: 'text-green-700' },
    'maintenance': { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    'emergency': { bg: 'bg-red-100', text: 'text-red-700' },
    'other': { bg: 'bg-gray-100', text: 'text-gray-600' },
};

export function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth(); // 0-indexed

    // Fetch events when month/year changes
    useEffect(() => {
        const loadEvents = async () => {
            setLoading(true);
            try {
                const data = await fetchCalendarEvents(year, month + 1); // API expects 1-indexed month
                setEvents(data);
            } catch (err) {
                console.error('Failed to load calendar events:', err);
                setEvents([]);
            } finally {
                setLoading(false);
            }
        };
        loadEvents();
    }, [year, month]);

    // Calendar utilities
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    // Navigation
    const goToPreviousMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
        setSelectedDate(null);
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
        setSelectedDate(null);
    };

    const goToToday = () => {
        setCurrentDate(new Date());
        setSelectedDate(null);
    };

    // Get events for a specific day
    const getDateEvents = (day: number): CalendarEvent[] => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return events.filter(e => e.date === dateStr);
    };

    const isToday = (day: number): boolean => {
        const today = new Date();
        return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
    };

    // Summary stats
    const totalScheduled = events.length;
    const completedCount = events.filter(e => e.status === 'completed').length;
    const missedCount = events.filter(e => e.status === 'missed').length;
    const upcomingCount = events.filter(e => e.status === 'scheduled').length;

    // Render calendar grid
    const renderCalendar = () => {
        const days = [];
        const totalCells = Math.ceil((firstDayOfMonth + daysInMonth) / 7) * 7;

        for (let i = 0; i < totalCells; i++) {
            const day = i - firstDayOfMonth + 1;
            const isValidDay = day > 0 && day <= daysInMonth;
            const dayEvents = isValidDay ? getDateEvents(day) : [];
            const hasEvents = dayEvents.length > 0;
            const isTodayDate = isValidDay && isToday(day);
            const dateStr = isValidDay ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '';

            days.push(
                <div
                    key={i}
                    onClick={() => isValidDay && hasEvents && setSelectedDate(dateStr)}
                    className={`
                        min-h-[100px] p-2 border border-gray-100 relative
                        ${!isValidDay ? 'bg-gray-50' : hasEvents ? 'bg-white cursor-pointer hover:bg-gray-50' : 'bg-white'}
                        ${isTodayDate ? 'ring-2 ring-primary ring-inset' : ''}
                        ${selectedDate === dateStr ? 'bg-blue-50' : ''}
                        transition-colors
                    `}
                >
                    {isValidDay && (
                        <>
                            <div className="flex items-center justify-between mb-1">
                                <span className={`
                                    text-sm font-medium
                                    ${isTodayDate ? 'bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs' : 'text-text-main'}
                                `}>
                                    {day}
                                </span>
                            </div>

                            {hasEvents && (
                                <div className="space-y-1">
                                    {dayEvents.slice(0, 2).map((event, idx) => {
                                        const statusStyle = STATUS_STYLES[event.status];
                                        return (
                                            <div
                                                key={idx}
                                                className={`text-xs px-1.5 py-1 rounded truncate flex items-center gap-1 ${statusStyle.bg} ${statusStyle.text}`}
                                            >
                                                {event.status === 'completed' && <CheckCircle size={10} />}
                                                {event.status === 'missed' && <AlertTriangle size={10} />}
                                                <span className="truncate">{event.location}</span>
                                            </div>
                                        );
                                    })}
                                    {dayEvents.length > 2 && (
                                        <div className="text-[10px] text-text-muted">
                                            +{dayEvents.length - 2} more
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            );
        }

        return days;
    };

    // Get selected date events
    const selectedEvents = selectedDate ? events.filter(e => e.date === selectedDate) : [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
                        <CalendarIcon className="text-primary" size={28} />
                        Schedule Calendar
                    </h1>
                    <p className="text-text-muted">View scheduled camps, trips, and follow-up sessions from uploaded schedules</p>
                </div>
            </div>

            {/* Monthly Summary Cards */}
            {!loading && events.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-blue-700">{totalScheduled}</p>
                        <p className="text-xs text-blue-600 font-medium">Total Scheduled</p>
                    </div>
                    <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-green-700">{completedCount}</p>
                        <p className="text-xs text-green-600 font-medium">Completed</p>
                    </div>
                    <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-orange-700">{upcomingCount}</p>
                        <p className="text-xs text-orange-600 font-medium">Upcoming</p>
                    </div>
                    <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-red-700">{missedCount}</p>
                        <p className="text-xs text-red-600 font-medium">Missed</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar */}
                <Card className="lg:col-span-2">
                    {/* Calendar Header */}
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                        <h2 className="text-xl font-bold text-text-main">
                            {monthNames[month]} {year}
                        </h2>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={goToToday} className="text-sm">
                                Today
                            </Button>
                            <Button variant="outline" onClick={goToPreviousMonth} className="px-3">
                                <ChevronLeft size={18} />
                            </Button>
                            <Button variant="outline" onClick={goToNextMonth} className="px-3">
                                <ChevronRight size={18} />
                            </Button>
                        </div>
                    </div>

                    {/* Info Banner */}
                    {!loading && events.length > 0 && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                            <p className="text-sm text-blue-700">
                                <strong>{events.length} events</strong> scheduled this month
                                {completedCount > 0 && <> • <span className="text-green-700 font-medium">{completedCount} completed</span></>}
                                {missedCount > 0 && <> • <span className="text-red-700 font-medium">{missedCount} missed</span></>}
                            </p>
                        </div>
                    )}

                    {!loading && events.length === 0 && (
                        <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                            <CalendarIcon size={32} className="mx-auto text-gray-300 mb-2" />
                            <p className="text-sm text-text-muted font-medium">No schedules uploaded for this month</p>
                            <p className="text-xs text-text-muted mt-1">Upload a schedule from Admin Control to see events here</p>
                        </div>
                    )}

                    {loading && (
                        <div className="flex justify-center py-8 mb-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    )}

                    {/* Day Headers */}
                    <div className="grid grid-cols-7 gap-0 mb-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="text-center text-sm font-semibold text-text-muted py-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-0 border-t border-gray-200">
                        {renderCalendar()}
                    </div>

                    {/* Legend */}
                    <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-4 text-xs">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-blue-50 border border-blue-200 rounded"></div>
                            <span className="text-text-muted">Scheduled</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-green-50 border border-green-200 rounded"></div>
                            <span className="text-text-muted">Completed (Trip Logged)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-red-50 border border-red-200 rounded"></div>
                            <span className="text-text-muted">Missed (No Trip)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-gray-50 border border-gray-200 rounded"></div>
                            <span className="text-text-muted">Cancelled</span>
                        </div>
                    </div>
                </Card>

                {/* Event Details Panel */}
                <Card className="lg:col-span-1">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-lg text-text-main">Event Details</h3>
                        {selectedDate && (
                            <button
                                onClick={() => setSelectedDate(null)}
                                className="text-text-muted hover:text-text-main"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>

                    {selectedDate ? (
                        <div className="space-y-4">
                            <div className="text-sm text-text-muted mb-4">
                                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </div>

                            {selectedEvents.map((event, idx) => {
                                const statusStyle = STATUS_STYLES[event.status];
                                const typeColor = EVENT_TYPE_COLORS[event.eventType];
                                return (
                                    <div
                                        key={idx}
                                        className={`p-4 rounded-lg border-l-4 ${statusStyle.bg} ${statusStyle.border}`}
                                    >
                                        {/* Status & Type badges */}
                                        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                                            <span className={`text-xs font-semibold px-2 py-1 rounded ${typeColor.bg} ${typeColor.text}`}>
                                                {event.eventType === 'follow-up' ? 'Follow-up' : event.eventType.charAt(0).toUpperCase() + event.eventType.slice(1)}
                                            </span>
                                            <span className={`text-xs font-semibold px-2 py-1 rounded flex items-center gap-1 ${statusStyle.bg} ${statusStyle.text}`}>
                                                <statusStyle.icon size={12} />
                                                {statusStyle.label}
                                            </span>
                                        </div>

                                        <div className="space-y-2 text-sm">
                                            {/* Location */}
                                            <div className="flex items-start gap-2">
                                                <MapPin size={16} className="text-text-muted mt-0.5 shrink-0" />
                                                <div>
                                                    <div className="font-medium text-text-main">{event.location}</div>
                                                    {event.address && (
                                                        <div className="text-xs text-text-muted">{event.address}</div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Trip details (if completed) */}
                                            {event.tripId && (
                                                <>
                                                    {event.busNumber && (
                                                        <div className="flex items-center gap-2">
                                                            <Bus size={16} className="text-text-muted shrink-0" />
                                                            <span className="text-text-main">{event.busNumber}</span>
                                                        </div>
                                                    )}

                                                    {event.driverName && (
                                                        <div className="flex items-center gap-2">
                                                            <User size={16} className="text-text-muted shrink-0" />
                                                            <span className="text-text-main">{event.driverName}</span>
                                                        </div>
                                                    )}

                                                    {(event.departureTime || event.returnTime) && (
                                                        <div className="flex items-center gap-2">
                                                            <Clock size={16} className="text-text-muted shrink-0" />
                                                            <span className="text-text-main">
                                                                {event.departureTime || '--'} - {event.returnTime || '--'}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {event.beneficiariesServed != null && event.beneficiariesServed > 0 && (
                                                        <div className="flex items-center gap-2">
                                                            <Users size={16} className="text-text-muted shrink-0" />
                                                            <span className="text-text-main">{event.beneficiariesServed} beneficiaries served</span>
                                                        </div>
                                                    )}
                                                </>
                                            )}

                                            {/* Action: Log trip for scheduled/missed events */}
                                            {(event.status === 'scheduled' || event.status === 'missed') && (
                                                <div className="mt-3 pt-3 border-t border-gray-200/50">
                                                    <Link
                                                        to={`/tracking/add-trip?date=${event.date}&location=${encodeURIComponent(event.location)}`}
                                                    >
                                                        <Button variant="outline" className="w-full text-xs flex items-center justify-center gap-2">
                                                            Log Trip <ArrowRight size={14} />
                                                        </Button>
                                                    </Link>
                                                </div>
                                            )}

                                            {/* View trip for completed events */}
                                            {event.status === 'completed' && event.tripId && (
                                                <div className="mt-3 pt-3 border-t border-gray-200/50">
                                                    <Link to={`/tracking/edit-trip/${event.tripId}`}>
                                                        <Button variant="outline" className="w-full text-xs flex items-center justify-center gap-2">
                                                            View Trip Details <ArrowRight size={14} />
                                                        </Button>
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <CalendarIcon size={48} className="mx-auto text-gray-300 mb-3" />
                            <p className="text-text-muted text-sm">
                                Click on a date with events to view details
                            </p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
