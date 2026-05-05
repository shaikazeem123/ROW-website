import { useState, useEffect } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LabelList,
} from "recharts";
import { Card } from "@/components/common/Card";
import {
    fetchServiceStats,
    fetchServiceSummary
} from "@/services/dashboardService";
import type { ServiceChartData, ServiceSummaryStats } from "@/services/dashboardService";
import type { TimeFrame, ChartFilter } from "@/types/dashboard";
import { Stethoscope, Users, TrendingUp, Activity, Filter } from "lucide-react";

interface Props {
    timeframe: TimeFrame;
    filter: ChartFilter;
}

export function ServiceDashboardChart({ timeframe, filter }: Props) {
    const [data, setData] = useState<ServiceChartData[]>([]);
    const [summary, setSummary] = useState<ServiceSummaryStats>({
        totalServices: 0,
        totalBeneficiaries: 0,
        mostActiveService: 'Loading...',
        avgServicesPerDay: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const [chartData, summaryData] = await Promise.all([
                fetchServiceStats(timeframe, filter),
                fetchServiceSummary(filter)
            ]);
            setData(chartData);
            setSummary(summaryData);
            setLoading(false);
        };
        loadData();
    }, [timeframe, filter]);

    return (
        <Card className="p-6 flex flex-col space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Stethoscope className="text-primary" size={20} />
                        Service Dashboard
                    </h3>
                    <p className="text-sm text-gray-500">
                        Monitoring service delivery and reach
                    </p>
                </div>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-primary/5 p-3 sm:p-4 rounded-xl border border-primary/10 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-white rounded-lg shadow-sm text-primary shrink-0">
                            <Activity size={16} />
                        </div>
                        <p className="text-[10px] sm:text-[11px] text-primary font-bold uppercase tracking-wider leading-tight min-w-0 break-words">Total Services</p>
                    </div>
                    <p className="text-xl font-black text-primary">{summary.totalServices}</p>
                </div>

                <div className="bg-blue-50 p-3 sm:p-4 rounded-xl border border-blue-100 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-white rounded-lg shadow-sm text-blue-600 shrink-0">
                            <Users size={16} />
                        </div>
                        <p className="text-[10px] sm:text-[11px] text-blue-700 font-bold uppercase tracking-wider leading-tight min-w-0 break-words">Beneficiaries</p>
                    </div>
                    <p className="text-xl font-black text-blue-900">{summary.totalBeneficiaries}</p>
                </div>

                <div className="bg-purple-50 p-3 sm:p-4 rounded-xl border border-purple-100 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-white rounded-lg shadow-sm text-purple-600 shrink-0">
                            <TrendingUp size={16} />
                        </div>
                        <p className="text-[10px] sm:text-[11px] text-purple-700 font-bold uppercase tracking-wider leading-tight min-w-0 break-words">Top Service</p>
                    </div>
                    <p className="text-sm font-bold text-purple-900 truncate" title={summary.mostActiveService}>
                        {summary.mostActiveService}
                    </p>
                </div>

                <div className="bg-orange-50 p-3 sm:p-4 rounded-xl border border-orange-100 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-white rounded-lg shadow-sm text-orange-600 shrink-0">
                            <Filter size={16} />
                        </div>
                        <p className="text-[10px] sm:text-[11px] text-orange-700 font-bold uppercase tracking-wider leading-tight min-w-0 break-words">Avg/Day</p>
                    </div>
                    <p className="text-xl font-black text-orange-900">{summary.avgServicesPerDay}</p>
                </div>
            </div>

            {/* Chart Area */}
            <div className="h-[250px] md:h-[350px] w-full mt-4">
                {loading ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : data.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <Stethoscope size={48} className="mb-2 opacity-10" />
                        <p className="text-sm">No service data for this period</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 11, fill: '#64748b' }}
                                axisLine={false}
                                tickLine={false}
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
                                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                                }}
                            />
                            <Bar
                                name="Services Delivered"
                                dataKey="count"
                                fill="#0ea5e9"
                                radius={[4, 4, 0, 0]}
                                barSize={timeframe === 'daily' ? 20 : 40}
                            >
                                <LabelList dataKey="count" position="top" style={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </Card>
    );
}
