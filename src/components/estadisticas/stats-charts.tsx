'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Area,
    AreaChart,
} from 'recharts';
import type { StatsPayload } from '@/lib/repository';

interface StatsChartsProps {
    stats: StatsPayload;
}

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

const CustomTooltipStyle = {
    contentStyle: {
        borderRadius: '8px',
        border: '1px solid hsl(214.3 31.8% 91.4%)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        fontSize: '12px',
    },
};

function formatMesShort(mes: string): string {
    const [, m] = mes.split('-');
    const meses = ['E', 'F', 'M', 'A', 'My', 'Jn', 'Jl', 'Ag', 'S', 'O', 'N', 'D'];
    return meses[parseInt(m, 10) - 1] ?? mes;
}

export function StatsCharts({ stats }: StatsChartsProps) {
    const { porMes, porPlataforma, topProgramas, porResponsableMes, porResponsable } = stats;

    // Prepare monthly trend data with labels
    const porMesConLabel = porMes.map(m => ({
        ...m,
        label: formatMesShort(m.mes),
        total: m.prod + m.preprod,
    }));

    // Per-person monthly data for last 6 months
    const uniqueMeses = [...new Set(porResponsableMes.map(r => r.mes))].sort();
    const top5Responsables = porResponsable.slice(0, 5).map(r => r.nombre);
    const perPersonData = uniqueMeses.map(mes => {
        const entry: Record<string, string | number> = { mes: formatMesShort(mes) };
        for (const resp of top5Responsables) {
            const found = porResponsableMes.find(r => r.mes === mes && r.responsable === resp);
            entry[resp] = found?.total ?? 0;
        }
        return entry;
    });

    // Pie data for platforms
    const pieData = porPlataforma.slice(0, 6).map((p, i) => ({
        name: p.plataforma || 'Desconocida',
        value: p.total,
        color: COLORS[i % COLORS.length],
    }));

    return (
        <div className="space-y-6">
            {/* Monthly bar chart + Area trend */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Despliegues por mes (últimos 12 m.)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart
                                data={porMesConLabel}
                                margin={{ top: 4, right: 8, left: -20, bottom: 4 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(214.3 31.8% 91.4%)" />
                                <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} axisLine={false} tickLine={false} />
                                <Tooltip {...CustomTooltipStyle} />
                                <Legend wrapperStyle={{ fontSize: 11 }} />
                                <Bar
                                    dataKey="prod"
                                    name="Producción"
                                    fill="#22c55e"
                                    radius={[4, 4, 0, 0]}
                                    isAnimationActive
                                    animationDuration={800}
                                    animationEasing="ease-out"
                                />
                                <Bar
                                    dataKey="preprod"
                                    name="Preproducción"
                                    fill="#f59e0b"
                                    radius={[4, 4, 0, 0]}
                                    isAnimationActive
                                    animationDuration={800}
                                    animationEasing="ease-out"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Tendencia acumulada</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={220}>
                            <AreaChart
                                data={porMesConLabel}
                                margin={{ top: 4, right: 8, left: -20, bottom: 4 }}
                            >
                                <defs>
                                    <linearGradient id="gradProd" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gradPreprod" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(214.3 31.8% 91.4%)" />
                                <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} axisLine={false} tickLine={false} />
                                <Tooltip {...CustomTooltipStyle} />
                                <Legend wrapperStyle={{ fontSize: 11 }} />
                                <Area
                                    type="monotone"
                                    dataKey="prod"
                                    name="Producción"
                                    stroke="#22c55e"
                                    strokeWidth={2}
                                    fill="url(#gradProd)"
                                    isAnimationActive
                                    animationDuration={1000}
                                    animationEasing="ease-out"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="preprod"
                                    name="Preproducción"
                                    stroke="#f59e0b"
                                    strokeWidth={2}
                                    fill="url(#gradPreprod)"
                                    isAnimationActive
                                    animationDuration={1000}
                                    animationEasing="ease-out"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Per person monthly line + Pie platforms */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {perPersonData.length > 0 && top5Responsables.length > 0 && (
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Actividad mensual por responsable (6 m.)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={240}>
                                <LineChart
                                    data={perPersonData}
                                    margin={{ top: 4, right: 16, left: -20, bottom: 4 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(214.3 31.8% 91.4%)" />
                                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} axisLine={false} tickLine={false} />
                                    <Tooltip {...CustomTooltipStyle} />
                                    <Legend wrapperStyle={{ fontSize: 11 }} />
                                    {top5Responsables.map((resp, i) => (
                                        <Line
                                            key={resp}
                                            type="monotone"
                                            dataKey={resp}
                                            stroke={COLORS[i % COLORS.length]}
                                            strokeWidth={2}
                                            dot={{ r: 3 }}
                                            activeDot={{ r: 5 }}
                                            isAnimationActive
                                            animationDuration={1000}
                                            animationEasing="ease-out"
                                        />
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                )}

                {pieData.length > 0 && (
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Distribución por plataforma</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4">
                                <ResponsiveContainer width="100%" height={200}>
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={85}
                                            paddingAngle={3}
                                            dataKey="value"
                                            isAnimationActive
                                            animationDuration={800}
                                            animationEasing="ease-out"
                                        >
                                            {pieData.map((entry, i) => (
                                                <Cell key={i} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            {...CustomTooltipStyle}
                                            formatter={(val: number, name: string) => [val, name]}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="flex flex-col gap-1.5 min-w-0 flex-shrink-0">
                                    {pieData.map(p => (
                                        <div key={p.name} className="flex items-center gap-2">
                                            <span
                                                className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: p.color }}
                                            />
                                            <span className="text-xs truncate max-w-24">{p.name}</span>
                                            <span className="text-xs font-bold ml-auto pl-2">{p.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Top programas */}
            {topProgramas.length > 0 && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Top 10 programas más desplegados</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart
                                data={topProgramas}
                                layout="vertical"
                                margin={{ top: 4, right: 16, left: 120, bottom: 4 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(214.3 31.8% 91.4%)" />
                                <XAxis
                                    type="number"
                                    tick={{ fontSize: 11 }}
                                    allowDecimals={false}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    dataKey="nombre"
                                    type="category"
                                    tick={{ fontSize: 11 }}
                                    width={115}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip {...CustomTooltipStyle} />
                                <Bar
                                    dataKey="total"
                                    name="Despliegues"
                                    fill="#6366f1"
                                    radius={[0, 4, 4, 0]}
                                    isAnimationActive
                                    animationDuration={900}
                                    animationEasing="ease-out"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
