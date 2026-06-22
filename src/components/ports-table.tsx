'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { PortData } from '@/app/(main)/ports/page';
import { ENTORNO_STYLES } from '@/lib/constants';

interface PortsTableProps {
    deployments: PortData[];
}

interface PortRow {
    applicationName: string;
    port: string;
    entorno: 'Producción' | 'Preproducción';
}

function parsePort(portStr: string): number {
    const n = parseInt(portStr, 10);
    return isNaN(n) ? 0 : n;
}

function getRangeLabel(port: number): string {
    if (port === 0) return 'Sin puerto';
    const base = Math.floor(port / 100) * 100;
    return `${base} – ${base + 99}`;
}

export default function PortsTable({ deployments }: PortsTableProps) {
    const [search, setSearch] = useState('');

    const allRows = useMemo<PortRow[]>(() => {
        const rows: PortRow[] = [];
        for (const d of deployments) {
            if (d.preproduccionPort && d.preproduccionPort !== 'N/A') {
                rows.push({ applicationName: d.applicationName, port: d.preproduccionPort, entorno: 'Preproducción' });
            }
            if (d.produccionPort && d.produccionPort !== 'N/A') {
                rows.push({ applicationName: d.applicationName, port: d.produccionPort, entorno: 'Producción' });
            }
        }
        return rows.sort((a, b) => parsePort(a.port) - parsePort(b.port));
    }, [deployments]);

    const filtered = useMemo(() => {
        if (!search.trim()) return allRows;
        const q = search.toLowerCase();
        return allRows.filter(r => r.applicationName.toLowerCase().includes(q) || r.port.includes(q));
    }, [allRows, search]);

    const grouped = useMemo(() => {
        const map = new Map<string, PortRow[]>();
        for (const row of filtered) {
            const label = getRangeLabel(parsePort(row.port));
            if (!map.has(label)) map.set(label, []);
            map.get(label)!.push(row);
        }
        return Array.from(map.entries());
    }, [filtered]);

    const usedPorts = useMemo(() => new Set(allRows.map(r => parsePort(r.port)).filter(p => p > 0)), [allRows]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Puertos</h1>
                    <p className="text-muted-foreground">{usedPorts.size} puertos en uso. Solo lectura — edita desde Despliegues.</p>
                </div>
            </div>
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar por programa o puerto..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Card>
                <CardHeader><CardTitle className="text-base">{filtered.length} asignaciones{search ? ` para "${search}"` : ''}</CardTitle></CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-32 pl-6">Puerto</TableHead>
                                <TableHead>Programa</TableHead>
                                <TableHead>Entorno</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {grouped.length === 0 ? (
                                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">Sin resultados</TableCell></TableRow>
                            ) : (
                                grouped.flatMap(([rangeLabel, rows]) => [
                                    <TableRow key={`range-${rangeLabel}`} className="bg-muted/30 hover:bg-muted/30">
                                        <TableCell colSpan={3} className="py-1.5 pl-6">
                                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rango {rangeLabel}</span>
                                        </TableCell>
                                    </TableRow>,
                                    ...rows.map((row, i) => {
                                        const styles = ENTORNO_STYLES[row.entorno];
                                        return (
                                            <TableRow key={`${row.applicationName}-${row.port}-${i}`}>
                                                <TableCell className="pl-6"><span className="font-mono font-semibold text-sm">{row.port}</span></TableCell>
                                                <TableCell className="font-medium">{row.applicationName}</TableCell>
                                                <TableCell><Badge variant="outline" className={`text-xs ${styles.badge}`}>{row.entorno}</Badge></TableCell>
                                            </TableRow>
                                        );
                                    })
                                ])
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
