'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Search, Server, ArrowUpDown } from 'lucide-react';
import { PortData } from '@/app/(main)/ports/page';
import { cn } from '@/lib/utils';

interface PortsTableProps {
    deployments: PortData[];
}

type SortKey = 'nombre' | 'preprod' | 'prod';

function parsePort(portStr: string): number {
    const n = parseInt(portStr, 10);
    return isNaN(n) ? 0 : n;
}

export default function PortsTable({ deployments }: PortsTableProps) {
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState<SortKey>('nombre');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

    const filtered = useMemo(() => {
        if (!search.trim()) return deployments;
        const q = search.toLowerCase();
        return deployments.filter(d =>
            d.applicationName.toLowerCase().includes(q) ||
            d.preproduccionPort.includes(q) ||
            d.produccionPort.includes(q)
        );
    }, [deployments, search]);

    const sorted = useMemo(() => {
        return [...filtered].sort((a, b) => {
            let cmp = 0;
            if (sort === 'nombre') {
                cmp = a.applicationName.localeCompare(b.applicationName);
            } else if (sort === 'preprod') {
                cmp = parsePort(a.preproduccionPort) - parsePort(b.preproduccionPort);
            } else {
                cmp = parsePort(a.produccionPort) - parsePort(b.produccionPort);
            }
            return sortDir === 'asc' ? cmp : -cmp;
        });
    }, [filtered, sort, sortDir]);

    const appsWithPorts = sorted.filter(
        d => d.preproduccionPort !== 'N/A' || d.produccionPort !== 'N/A'
    );

    const totalPorts = deployments.reduce((n, d) => {
        let count = 0;
        if (d.preproduccionPort !== 'N/A') count++;
        if (d.produccionPort !== 'N/A') count++;
        return n + count;
    }, 0);

    const toggleSort = (key: SortKey) => {
        if (sort === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
        else { setSort(key); setSortDir('asc'); }
    };

    const SortBtn = ({ col, label }: { col: SortKey; label: string }) => (
        <button
            onClick={() => toggleSort(col)}
            className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
            {label}
            <ArrowUpDown className={cn('h-3 w-3', sort === col ? 'opacity-100' : 'opacity-40')} />
        </button>
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Puertos</h1>
                    <p className="text-muted-foreground text-sm">
                        {totalPorts} puertos en uso · Solo lectura — edita desde Despliegues
                    </p>
                </div>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar programa o puerto..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9"
                />
            </div>

            <div className="border rounded-xl overflow-hidden bg-background shadow-sm">
                {/* Header */}
                <div className="grid ports-grid bg-muted/40 border-b">
                    <div className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <SortBtn col="nombre" label="Programa" />
                    </div>
                    <div className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center border-l bg-amber-50/60">
                        <SortBtn col="preprod" label="PreProducción" />
                    </div>
                    <div className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center border-l bg-green-50/60">
                        <SortBtn col="prod" label="Producción" />
                    </div>
                </div>

                {appsWithPorts.length === 0 ? (
                    <div className="py-16 text-center text-muted-foreground text-sm">
                        Sin resultados para &quot;{search}&quot;
                    </div>
                ) : (
                    appsWithPorts.map((d, i) => (
                        <div
                            key={d.id}
                            className={cn(
                                'grid ports-grid border-b last:border-0 transition-colors',
                                'hover:bg-primary/5',
                                i % 2 === 1 ? 'bg-muted/20' : 'bg-background'
                            )}
                        >
                            <div className="px-4 py-2.5 flex items-center gap-2 min-w-0">
                                <Server className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                <span className="text-sm font-medium truncate">{d.applicationName}</span>
                            </div>

                            <div
                                className={cn(
                                    'px-4 py-2.5 flex items-center justify-center border-l',
                                    i % 2 === 1 ? 'bg-amber-50/40' : 'bg-amber-50/20'
                                )}
                            >
                                {d.preproduccionPort !== 'N/A' ? (
                                    <span className="font-mono text-sm font-bold text-amber-700 tabular-nums">
                                        {d.preproduccionPort}
                                    </span>
                                ) : (
                                    <span className="text-muted-foreground/50 text-sm">—</span>
                                )}
                            </div>

                            <div
                                className={cn(
                                    'px-4 py-2.5 flex items-center justify-center border-l',
                                    i % 2 === 1 ? 'bg-green-50/40' : 'bg-green-50/20'
                                )}
                            >
                                {d.produccionPort !== 'N/A' ? (
                                    <span className="font-mono text-sm font-bold text-green-700 tabular-nums">
                                        {d.produccionPort}
                                    </span>
                                ) : (
                                    <span className="text-muted-foreground/50 text-sm">—</span>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <p className="text-xs text-muted-foreground">
                Mostrando {appsWithPorts.length} de {deployments.length} aplicaciones
            </p>
        </div>
    );
}
