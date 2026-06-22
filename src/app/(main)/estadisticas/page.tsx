import { repository } from '@/lib/repository';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/loading-spinner';
import { StatsCharts } from '@/components/estadisticas/stats-charts';
import type { StatsPayload } from '@/lib/repository';

export default async function EstadisticasPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Estadísticas</h1>
                <p className="text-muted-foreground">Resumen de actividad de despliegues.</p>
            </div>
            <Suspense fallback={<LoadingSpinner />}>
                <StatsContent />
            </Suspense>
        </div>
    );
}

async function StatsContent() {
    const stats = await repository.getStats();
    const { totales, porResponsable, porServicio } = stats;

    const primerFecha = totales.primerDespliegue ? new Date(totales.primerDespliegue).toLocaleDateString('es-ES') : '—';
    const ultimaFecha = totales.ultimoDespliegue ? new Date(totales.ultimoDespliegue).toLocaleDateString('es-ES') : '—';

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KPICard title="Total despliegues" value={totales.total} />
                <KPICard title="En producción" value={totales.prod} className="border-green-200 bg-green-50" />
                <KPICard title="En preproducción" value={totales.preprod} className="border-amber-200 bg-amber-50" />
                <KPICard title="Servicios activos" value={totales.serviciosActivos} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KPICard title="Promedio / mes" value={totales.promedioMensual} subtitle="desde el inicio" />
                <KPICard title="Primer despliegue" value={primerFecha} isText />
                <KPICard title="Último despliegue" value={ultimaFecha} isText />
                <KPICard title="Sin servicio" value={totales.programasSinServicio} subtitle="programas" />
            </div>

            <StatsCharts stats={stats} />

            <Card>
                <CardHeader><CardTitle className="text-base">Actividad por responsable</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Responsable</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead className="text-right"><Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 text-xs font-normal">Producción</Badge></TableHead>
                                <TableHead className="text-right"><Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200 text-xs font-normal">Preproducción</Badge></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {porResponsable.map((r, i) => (
                                <TableRow key={r.nombre}>
                                    <TableCell className="font-medium">{i === 0 && <span className="mr-2">🏆</span>}{r.nombre}</TableCell>
                                    <TableCell className="text-right font-semibold">{r.total}</TableCell>
                                    <TableCell className="text-right text-green-700">{r.prod}</TableCell>
                                    <TableCell className="text-right text-amber-700">{r.preprod}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {porServicio.length > 0 && (
                <Card>
                    <CardHeader><CardTitle className="text-base">Resumen por servicio</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Servicio</TableHead>
                                    <TableHead className="text-center">Programas</TableHead>
                                    <TableHead className="text-center">Prod</TableHead>
                                    <TableHead className="text-center">Preprod</TableHead>
                                    <TableHead>Último deploy</TableHead>
                                    <TableHead>+ Activo</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {porServicio.map(s => (
                                    <TableRow key={s.servicio}>
                                        <TableCell className="font-medium">{s.servicio}</TableCell>
                                        <TableCell className="text-center">{s.numProgramas}</TableCell>
                                        <TableCell className="text-center text-green-700">{s.prod}</TableCell>
                                        <TableCell className="text-center text-amber-700">{s.preprod}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{s.ultimoDespliegue ? new Date(s.ultimoDespliegue).toLocaleDateString('es-ES') : '—'}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{s.topResponsable ?? '—'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

function KPICard({ title, value, subtitle, className, isText = false }: {
    title: string; value: number | string; subtitle?: string; className?: string; isText?: boolean;
}) {
    return (
        <Card className={className}>
            <CardContent className="p-4">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{title}</p>
                <p className={isText ? 'text-lg font-semibold mt-1' : 'text-3xl font-bold mt-1'}>{value}</p>
                {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
            </CardContent>
        </Card>
    );
}
