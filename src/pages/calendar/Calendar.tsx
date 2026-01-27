import { useState } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    MapPin,
    User,
    Clock,
    Phone,
    X
} from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { getEventsByDate, getEventsByMonth } from '@/data/screeningSchedule';
import type { ScreeningEvent } from '@/types/screening';

export function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Get month events
    const monthEvents = getEventsByMonth(year, month + 1);

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

    // Check if date has events
    const getDateEvents = (day: number): ScreeningEvent[] => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return getEventsByDate(dateStr);
    };

    // Check if date is today
    const isToday = (day: number): boolean => {
        const today = new Date();
        return today.getDate() === day &&
            today.getMonth() === month &&
            today.getFullYear() === year;
    };

    // Check if date is in first 5 days (screening assessment period)
    const isScreeningAssessmentDay = (day: number): boolean => {
        return day >= 1 && day <= 5;
    };

    // Render calendar grid
    const renderCalendar = () => {
        const days = [];
        const totalCells = Math.ceil((firstDayOfMonth + daysInMonth) / 7) * 7;

        for (let i = 0; i < totalCells; i++) {
            const day = i - firstDayOfMonth + 1;
            const isValidDay = day > 0 && day <= daysInMonth;
            const events = isValidDay ? getDateEvents(day) : [];
            const hasEvents = events.length > 0;
            const isScreeningDay = isValidDay && isScreeningAssessmentDay(day);
            const isTodayDate = isValidDay && isToday(day);
            const dateStr = isValidDay ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '';

            days.push(
                <div
                    key={i}
                    onClick={() => isValidDay && hasEvents && setSelectedDate(dateStr)}
                    className={`
                        min-h-[100px] p-2 border border-gray-100 relative
                        ${!isValidDay ? 'bg-gray-50' : 'bg-white cursor-pointer hover:bg-gray-50'}
                        ${isTodayDate ? 'ring-2 ring-primary ring-inset' : ''}
                        ${selectedDate === dateStr ? 'bg-blue-50' : ''}
                        ${isScreeningDay && hasEvents ? 'bg-primary/5' : ''}
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
                                {isScreeningDay && hasEvents && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium">
                                        Screening
                                    </span>
                                )}
                            </div>

                            {hasEvents && (
                                <div className="space-y-1">
                                    {events.slice(0, 2).map((event, idx) => (
                                        <div
                                            key={idx}
                                            className={`
                                                text-xs px-1.5 py-1 rounded truncate
                                                ${event.eventType === 'screening'
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'bg-green-100 text-green-700'
                                                }
                                            `}
                                        >
                                            {event.location}
                                        </div>
                                    ))}
                                    {events.length > 2 && (
                                        <div className="text-[10px] text-text-muted">
                                            +{events.length - 2} more
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
    const selectedEvents = selectedDate ? getEventsByDate(selectedDate) : [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
                        <CalendarIcon className="text-primary" size={28} />
                        Screening Calendar
                    </h1>
                    <p className="text-text-muted">View and manage screening schedules and follow-up sessions</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar */}
                <Card className="lg:col-span-2">
                    {/* Calendar Header */}
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                        <h2 className="text-xl font-bold text-text-main">
                            {monthNames[month]} {year}
                        </h2>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={goToToday}
                                className="text-sm"
                            >
                                Today
                            </Button>
                            <Button
                                variant="outline"
                                onClick={goToPreviousMonth}
                                className="px-3"
                            >
                                <ChevronLeft size={18} />
                            </Button>
                            <Button
                                variant="outline"
                                onClick={goToNextMonth}
                                className="px-3"
                            >
                                <ChevronRight size={18} />
                            </Button>
                        </div>
                    </div>

                    {/* Info Banner */}
                    {monthEvents.length > 0 && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                            <p className="text-sm text-blue-700">
                                <strong>{monthEvents.length} events</strong> scheduled this month
                                {monthEvents.some(e => e.eventType === 'screening') && (
                                    <> • <span className="font-medium">First 5 days: Screening Assessment Period</span></>
                                )}
                            </p>
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
                            <div className="w-4 h-4 bg-blue-100 rounded"></div>
                            <span className="text-text-muted">Screening Event</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-green-100 rounded"></div>
                            <span className="text-text-muted">Follow-up Session</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-primary/5 border border-primary/20 rounded"></div>
                            <span className="text-text-muted">Screening Assessment Period (Days 1-5)</span>
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

                            {selectedEvents.map((event, idx) => (
                                <div
                                    key={idx}
                                    className={`
                                        p-4 rounded-lg border-l-4
                                        ${event.eventType === 'screening'
                                            ? 'bg-blue-50 border-l-blue-500'
                                            : 'bg-green-50 border-l-green-500'
                                        }
                                    `}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <span className={`
                                            text-xs font-semibold px-2 py-1 rounded
                                            ${event.eventType === 'screening'
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-green-100 text-green-700'
                                            }
                                        `}>
                                            {event.eventType === 'screening' ? 'Screening' : `Follow-up #${event.followUpNumber}`}
                                        </span>
                                    </div>

                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-start gap-2">
                                            <MapPin size={16} className="text-text-muted mt-0.5 shrink-0" />
                                            <div>
                                                <div className="font-medium text-text-main">{event.location}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <User size={16} className="text-text-muted shrink-0" />
                                            <span className="text-text-main">{event.contactPerson}</span>
                                        </div>

                                        {event.contactPhone && (
                                            <div className="flex items-center gap-2">
                                                <Phone size={16} className="text-text-muted shrink-0" />
                                                <span className="text-text-main">{event.contactPhone}</span>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2">
                                            <Clock size={16} className="text-text-muted shrink-0" />
                                            <span className="text-text-main">{event.timeIn} - {event.timeOut}</span>
                                        </div>

                                        <div className="mt-3 pt-3 border-t border-gray-200/50">
                                            <p className="text-xs text-text-muted">{event.purpose}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
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
