import { repository } from '@/lib/repository';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/loading-spinner';
import { StatsCharts } from '@/components/estadisticas/stats-charts';
import type { StatsPayload } from '@/lib/repository';
import { Trophy, Flame, TrendingUp, Medal, Star, Calendar, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export default async function EstadisticasPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Estadísticas</h1>
                <p className="text-muted-foreground">Actividad de despliegues · Rankings · Records</p>
            </div>
            <Suspense fallback={<LoadingSpinner />}>
                <StatsContent />
            </Suspense>
        </div>
    );
}

function formatMes(mes: string): string {
    if (!mes) return '—';
    const [y, m] = mes.split('-');
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${meses[parseInt(m, 10) - 1]} ${y}`;
}

async function StatsContent() {
    const stats = await repository.getStats();
    const { totales, porResponsable, porServicio, topMesActual, recordMes, porResponsableMes } = stats;

    const primerFecha = totales.primerDespliegue
        ? new Date(totales.primerDespliegue).toLocaleDateString('es-ES')
        : '—';
    const ultimaFecha = totales.ultimoDespliegue
        ? new Date(totales.ultimoDespliegue).toLocaleDateString('es-ES')
        : '—';

    const mesActualLabel = formatMes(new Date().toISOString().slice(0, 7));
    const topResponsableAllTime = porResponsable[0] ?? null;

    // Compute record responsable (best single month)
    const recordByPerson = porResponsableMes.reduce<{ responsable: string; mes: string; total: number } | null>(
        (best, cur) => (!best || cur.total > best.total ? cur : best),
        null
    );

    // Days since last deploy
    const diasDesdeUltimo = totales.ultimoDespliegue
        ? Math.floor((Date.now() - new Date(totales.ultimoDespliegue).getTime()) / 86400000)
        : null;

    return (
        <div className="space-y-8">
            {/* KPIs principales */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KPICard
                    title="Total despliegues"
                    value={totales.total}
                    icon={<Zap className="h-4 w-4" />}
                    color="blue"
                />
                <KPICard
                    title="En producción"
                    value={totales.prod}
                    icon={<TrendingUp className="h-4 w-4" />}
                    color="green"
                    subtitle={`${totales.total > 0 ? Math.round((totales.prod / totales.total) * 100) : 0}% del total`}
                />
                <KPICard
                    title="En preproducción"
                    value={totales.preprod}
                    icon={<Flame className="h-4 w-4" />}
                    color="amber"
                    subtitle={`${totales.total > 0 ? Math.round((totales.preprod / totales.total) * 100) : 0}% del total`}
                />
                <KPICard
                    title="Promedio / mes"
                    value={totales.promedioMensual}
                    icon={<Calendar className="h-4 w-4" />}
                    color="purple"
                    subtitle="desde el inicio"
                />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KPICard title="Servicios activos" value={totales.serviciosActivos} isText={false} />
                <KPICard title="Primer despliegue" value={primerFecha} isText />
                <KPICard title="Último despliegue" value={ultimaFecha} isText
                    subtitle={diasDesdeUltimo !== null ? `hace ${diasDesdeUltimo} día${diasDesdeUltimo !== 1 ? 's' : ''}` : undefined}
                />
                <KPICard title="Sin servicio" value={totales.programasSinServicio} subtitle="programas" />
            </div>

            {/* Leaderboard mes actual + Record mes + Campeón histórico */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Leaderboard mes actual */}
                <Card className="md:col-span-2">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100">
                                <Trophy className="h-4 w-4 text-amber-600" />
                            </div>
                            <div>
                                <CardTitle className="text-base">Ranking {mesActualLabel}</CardTitle>
                                <p className="text-xs text-muted-foreground">¿Quién más desplega este mes?</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {topMesActual.length === 0 ? (
                            <div className="py-8 text-center text-muted-foreground text-sm">
                                Sin despliegues este mes todavía.<br />
                                <span className="font-semibold text-foreground">¡Sé el primero en desplegar!</span>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {topMesActual.slice(0, 5).map((r, i) => (
                                    <div
                                        key={r.nombre}
                                        className={cn(
                                            'flex items-center gap-3 rounded-lg px-3 py-2 transition-colors',
                                            i === 0 && 'bg-amber-50 border border-amber-200'
                                        )}
                                    >
                                        <span className="text-sm font-bold w-5 text-center text-muted-foreground">
                                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                                        </span>
                                        <span className="flex-1 font-medium text-sm">{r.nombre}</span>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 text-xs">
                                                {r.prod} prod
                                            </Badge>
                                            <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200 text-xs">
                                                {r.preprod} pre
                                            </Badge>
                                            <span className="font-bold text-sm w-6 text-right">{r.total}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Records */}
                <div className="space-y-4">
                    {/* Record mes */}
                    <Card>
                        <CardContent className="p-4 space-y-1">
                            <div className="flex items-center gap-2">
                                <Star className="h-4 w-4 text-amber-500" />
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Mes récord
                                </p>
                            </div>
                            {recordMes ? (
                                <>
                                    <p className="text-2xl font-bold">{recordMes.total}</p>
                                    <p className="text-xs text-muted-foreground">{formatMes(recordMes.mes)}</p>
                                </>
                            ) : (
                                <p className="text-sm text-muted-foreground">Sin datos</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Campeón histórico */}
                    {topResponsableAllTime && (
                        <Card>
                            <CardContent className="p-4 space-y-1">
                                <div className="flex items-center gap-2">
                                    <Medal className="h-4 w-4 text-yellow-500" />
                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        Campeón histórico
                                    </p>
                                </div>
                                <p className="text-lg font-bold leading-tight">{topResponsableAllTime.nombre}</p>
                                <p className="text-xs text-muted-foreground">
                                    {topResponsableAllTime.total} despliegues en total
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Record personal */}
                    {recordByPerson && (
                        <Card>
                            <CardContent className="p-4 space-y-1">
                                <div className="flex items-center gap-2">
                                    <Flame className="h-4 w-4 text-orange-500" />
                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        Mejor mes personal
                                    </p>
                                </div>
                                <p className="text-lg font-bold leading-tight">{recordByPerson.responsable}</p>
                                <p className="text-xs text-muted-foreground">
                                    {recordByPerson.total} deploys en {formatMes(recordByPerson.mes)}
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Gráficas */}
            <StatsCharts stats={stats} />

            {/* Rankings históricos - split Prod / Preprod */}
            <div className="space-y-2">
                <h2 className="text-base font-semibold flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    Rankings históricos por responsable
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Ranking Producción */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
                                Clasificación Producción
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-green-50/60">
                                        <TableHead className="pl-4 w-8">#</TableHead>
                                        <TableHead>Responsable</TableHead>
                                        <TableHead className="text-right pr-4">Prod</TableHead>
                                        <TableHead className="text-right pr-4 text-muted-foreground">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {[...porResponsable]
                                        .sort((a, b) => b.prod - a.prod)
                                        .filter(r => r.prod > 0)
                                        .map((r, i) => {
                                            const mesesActivo = new Set(
                                                porResponsableMes
                                                    .filter(m => m.responsable === r.nombre)
                                                    .map(m => m.mes)
                                            ).size;
                                            return (
                                                <TableRow key={r.nombre} className={cn(i % 2 === 1 && 'bg-muted/20')}>
                                                    <TableCell className="pl-4 text-xs font-mono text-muted-foreground">
                                                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                                                    </TableCell>
                                                    <TableCell>
                                                        <p className="font-medium text-sm">{r.nombre}</p>
                                                        <p className="text-[10px] text-muted-foreground">
                                                            {mesesActivo > 0 ? `${mesesActivo} meses activo` : ''}
                                                        </p>
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold text-green-700 pr-4">{r.prod}</TableCell>
                                                    <TableCell className="text-right text-muted-foreground text-sm pr-4">{r.total}</TableCell>
                                                </TableRow>
                                            );
                                        })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Ranking Preproducción */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500" />
                                Clasificación Preproducción
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-amber-50/60">
                                        <TableHead className="pl-4 w-8">#</TableHead>
                                        <TableHead>Responsable</TableHead>
                                        <TableHead className="text-right pr-4">Preprod</TableHead>
                                        <TableHead className="text-right pr-4 text-muted-foreground">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {[...porResponsable]
                                        .sort((a, b) => b.preprod - a.preprod)
                                        .filter(r => r.preprod > 0)
                                        .map((r, i) => {
                                            const pctPreprod = r.total > 0
                                                ? Math.round((r.preprod / r.total) * 100)
                                                : 0;
                                            return (
                                                <TableRow key={r.nombre} className={cn(i % 2 === 1 && 'bg-muted/20')}>
                                                    <TableCell className="pl-4 text-xs font-mono text-muted-foreground">
                                                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                                                    </TableCell>
                                                    <TableCell>
                                                        <p className="font-medium text-sm">{r.nombre}</p>
                                                        <p className="text-[10px] text-muted-foreground">
                                                            {pctPreprod}% de sus deploys
                                                        </p>
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold text-amber-700 pr-4">{r.preprod}</TableCell>
                                                    <TableCell className="text-right text-muted-foreground text-sm pr-4">{r.total}</TableCell>
                                                </TableRow>
                                            );
                                        })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Tabla resumen completo */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">Resumen completo por responsable</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/40">
                                <TableHead className="pl-6">#</TableHead>
                                <TableHead>Responsable</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead className="text-right">
                                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 text-xs font-normal">Prod</Badge>
                                </TableHead>
                                <TableHead className="text-right">
                                    <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200 text-xs font-normal">Preprod</Badge>
                                </TableHead>
                                <TableHead className="text-right text-muted-foreground text-xs">% Prod</TableHead>
                                <TableHead className="text-right text-muted-foreground text-xs">Meses activo</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {porResponsable.map((r, i) => {
                                const mesesActivo = new Set(
                                    porResponsableMes
                                        .filter(m => m.responsable === r.nombre)
                                        .map(m => m.mes)
                                ).size;
                                const pctProd = r.total > 0
                                    ? Math.round((r.prod / r.total) * 100)
                                    : 0;
                                return (
                                    <TableRow key={r.nombre} className={cn(i % 2 === 1 && 'bg-muted/20')}>
                                        <TableCell className="pl-6 text-muted-foreground font-mono text-xs">
                                            {i === 0 ? '🏆' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                                        </TableCell>
                                        <TableCell className="font-medium">{r.nombre}</TableCell>
                                        <TableCell className="text-right font-bold">{r.total}</TableCell>
                                        <TableCell className="text-right text-green-700 font-medium">{r.prod}</TableCell>
                                        <TableCell className="text-right text-amber-700 font-medium">{r.preprod}</TableCell>
                                        <TableCell className="text-right text-muted-foreground text-sm">{pctProd}%</TableCell>
                                        <TableCell className="text-right text-muted-foreground text-sm">{mesesActivo || '—'}</TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Tabla servicios */}
            {porServicio.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Actividad por servicio</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/40">
                                    <TableHead className="pl-6">Servicio</TableHead>
                                    <TableHead className="text-center">Programas</TableHead>
                                    <TableHead className="text-center">Prod</TableHead>
                                    <TableHead className="text-center">Preprod</TableHead>
                                    <TableHead>Último deploy</TableHead>
                                    <TableHead>Más activo</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {porServicio.map((s, i) => (
                                    <TableRow key={s.servicio} className={cn(i % 2 === 1 && 'bg-muted/20')}>
                                        <TableCell className="pl-6 font-medium">{s.servicio}</TableCell>
                                        <TableCell className="text-center">{s.numProgramas}</TableCell>
                                        <TableCell className="text-center text-green-700 font-medium">{s.prod}</TableCell>
                                        <TableCell className="text-center text-amber-700 font-medium">{s.preprod}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {s.ultimoDespliegue
                                                ? new Date(s.ultimoDespliegue).toLocaleDateString('es-ES')
                                                : '—'}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {s.topResponsable ?? '—'}
                                        </TableCell>
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

function KPICard({
    title,
    value,
    subtitle,
    className,
    isText = false,
    icon,
    color,
}: {
    title: string;
    value: number | string;
    subtitle?: string;
    className?: string;
    isText?: boolean;
    icon?: React.ReactNode;
    color?: 'blue' | 'green' | 'amber' | 'purple';
}) {
    const colorMap = {
        blue: 'border-blue-200 bg-blue-50 [&_.kpi-icon]:bg-blue-100 [&_.kpi-icon]:text-blue-600',
        green: 'border-green-200 bg-green-50 [&_.kpi-icon]:bg-green-100 [&_.kpi-icon]:text-green-600',
        amber: 'border-amber-200 bg-amber-50 [&_.kpi-icon]:bg-amber-100 [&_.kpi-icon]:text-amber-600',
        purple: 'border-purple-200 bg-purple-50 [&_.kpi-icon]:bg-purple-100 [&_.kpi-icon]:text-purple-600',
    };

    return (
        <Card className={cn(color && colorMap[color], className)}>
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide leading-tight">
                        {title}
                    </p>
                    {icon && (
                        <div className="kpi-icon flex h-6 w-6 items-center justify-center rounded-md flex-shrink-0">
                            {icon}
                        </div>
                    )}
                </div>
                <p className={cn('mt-1 font-bold', isText ? 'text-lg' : 'text-3xl')}>{value}</p>
                {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
            </CardContent>
        </Card>
    );
}
