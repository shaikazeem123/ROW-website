import { useState, useEffect } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    LabelList
} from "recharts";
import { Card } from "@/components/common/Card";
import {
    fetchBusCoverageStats,
    fetchUniqueBuses
} from "@/services/dashboardService";
import type { TimeFrame, BusCoverageData } from "@/types/dashboard";
import { Bus, MapPin, Users } from "lucide-react";

export function BusTrackingChart() {
    const [data, setData] = useState<BusCoverageData[]>([]);
    const [buses, setBuses] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [timeframe, setTimeframe] = useState<TimeFrame>("monthly");
    const [selectedBus, setSelectedBus] = useState<string>("All");
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
        fetchUniqueBuses().then(setBuses);
    }, []);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const chartData = await fetchBusCoverageStats(timeframe, {
                startDate: dateRange.start,
                endDate: dateRange.end,
                busId: selectedBus,
            });
            setData(chartData);
            setLoading(false);
        };
        loadData();
    }, [timeframe, selectedBus, dateRange]);

    return (
        <Card className="p-6 h-[500px] flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Bus className="text-green-600" size={20} />
                        Bus Performance & Reach
                    </h3>
                    <p className="text-sm text-gray-500">
                        Locations covered vs Beneficiaries served
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        {(['daily', 'monthly', 'yearly'] as const).map((t) => (
                            <button
                                key={t}
                                onClick={() => setTimeframe(t)}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${timeframe === t
                                    ? 'bg-white text-green-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-900'
                                    }`}
                            >
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                            </button>
                        ))}
                    </div>

                    <select
                        className="text-sm border-gray-200 rounded-md focus:ring-green-500 focus:border-green-500"
                        value={selectedBus}
                        onChange={(e) => setSelectedBus(e.target.value)}
                    >
                        <option value="All">All Buses</option>
                        {buses.map((bus) => (
                            <option key={bus} value={bus}>{bus}</option>
                        ))}
                    </select>

                    <div className="flex items-center gap-2 text-sm">
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            className="border border-gray-200 rounded px-2 py-1 text-xs"
                        />
                        <span className="text-gray-400">-</span>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                            className="border border-gray-200 rounded px-2 py-1 text-xs"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                            <MapPin size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-green-700 font-medium uppercase tracking-wider">Total Locations</p>
                            <p className="text-xl font-bold text-green-900">{data.reduce((acc, curr) => acc + curr.coveredLocationsCount, 0)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <Users size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-blue-700 font-medium uppercase tracking-wider">Total Served</p>
                            <p className="text-xl font-bold text-blue-900">{data.reduce((acc, curr) => acc + curr.beneficiariesServed, 0)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
            ) : data.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                    <MapPin size={48} className="mb-2 opacity-20" />
                    <p>No trip data found for this period</p>
                </div>
            ) : (
                <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }} barGap={8}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                                axisLine={false}
                                tickLine={false}
                                dy={10}
                            />
                            <YAxis
                                tick={{ fontSize: 11, fill: '#64748b' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                cursor={{ fill: '#f8fafc' }}
                                contentStyle={{
                                    borderRadius: '12px',
                                    border: 'none',
                                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                                    padding: '12px'
                                }}
                            />
                            <Legend
                                verticalAlign="top"
                                height={36}
                                iconType="circle"
                                wrapperStyle={{ paddingBottom: '20px' }}
                            />
                            <Bar
                                name="Locations Covered"
                                dataKey="coveredLocationsCount"
                                fill="#22c55e"
                                radius={[4, 4, 0, 0]}
                                barSize={30}
                            >
                                <LabelList dataKey="coveredLocationsCount" position="top" style={{ fill: '#16a34a', fontSize: 10, fontWeight: 600 }} />
                            </Bar>
                            <Bar
                                name="Beneficiaries Served"
                                dataKey="beneficiariesServed"
                                fill="#3b82f6"
                                radius={[4, 4, 0, 0]}
                                barSize={30}
                            >
                                <LabelList dataKey="beneficiariesServed" position="top" style={{ fill: '#2563eb', fontSize: 10, fontWeight: 600 }} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </Card>
    );
}
