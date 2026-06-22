'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { StatsPayload } from '@/lib/repository';

interface StatsChartsProps {
    stats: StatsPayload;
}

export function StatsCharts({ stats }: StatsChartsProps) {
    const { porMes, porPlataforma, topProgramas } = stats;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle className="text-base">Despliegues por mes (últimos 12 meses)</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={porMes} margin={{ top: 4, right: 8, left: -20, bottom: 4 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="prod" name="Producción" fill="#22c55e" radius={[3, 3, 0, 0]} />
                                <Bar dataKey="preprod" name="Preproducción" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle className="text-base">Despliegues por plataforma</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={porPlataforma} layout="vertical" margin={{ top: 4, right: 16, left: 20, bottom: 4 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                                <YAxis dataKey="plataforma" type="category" tick={{ fontSize: 11 }} width={70} />
                                <Tooltip />
                                <Bar dataKey="total" name="Total" fill="#6366f1" radius={[0, 3, 3, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {topProgramas.length > 0 && (
                <Card>
                    <CardHeader><CardTitle className="text-base">Top 10 programas más desplegados</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={topProgramas} layout="vertical" margin={{ top: 4, right: 16, left: 120, bottom: 4 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                                <YAxis dataKey="nombre" type="category" tick={{ fontSize: 11 }} width={115} />
                                <Tooltip />
                                <Bar dataKey="total" name="Despliegues" fill="#3b82f6" radius={[0, 3, 3, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
