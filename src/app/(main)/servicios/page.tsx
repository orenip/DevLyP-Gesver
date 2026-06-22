import Link from 'next/link';
import { repository } from '@/lib/repository';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil } from 'lucide-react';
import { DeleteServiceDialog } from '@/components/servicios/delete-service-dialog';

export default async function ServiciosPage() {
    const servicios = await repository.getServicios();

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Servicios</h1>
                    <p className="text-muted-foreground">Gestiona los servicios y sus programas asociados.</p>
                </div>
                <Button asChild>
                    <Link href="/servicios/nuevo"><Plus className="mr-2 h-4 w-4" />Nuevo servicio</Link>
                </Button>
            </div>
            <Card>
                <CardHeader><CardTitle>{servicios.length} servicios</CardTitle></CardHeader>
                <CardContent>
                    {servicios.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                            No hay servicios creados. <Link href="/servicios/nuevo" className="underline">Crear el primero.</Link>
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Servicio</TableHead>
                                    <TableHead className="text-center">Programas</TableHead>
                                    <TableHead className="text-center">Despliegues</TableHead>
                                    <TableHead>Entornos</TableHead>
                                    <TableHead>Último despliegue</TableHead>
                                    <TableHead className="w-24">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {servicios.map(s => (
                                    <TableRow key={s.id}>
                                        <TableCell>
                                            <Link href={`/servicios/${s.id}`} className="flex items-center gap-2 hover:underline font-medium">
                                                <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color ?? '#6B7280' }} />
                                                {s.nombre}
                                            </Link>
                                            {s.descripcion && <p className="text-xs text-muted-foreground mt-0.5 ml-5">{s.descripcion}</p>}
                                        </TableCell>
                                        <TableCell className="text-center">{s.numProgramas}</TableCell>
                                        <TableCell className="text-center">{s.numDespliegues}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                {s.tieneProduccion && <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 text-xs">Prod</Badge>}
                                                {s.tienePreproduccion && <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200 text-xs">Preprod</Badge>}
                                                {!s.tieneProduccion && !s.tienePreproduccion && <Badge variant="outline" className="text-xs">Sin despliegues</Badge>}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {s.ultimoDespliegue ? new Date(s.ultimoDespliegue).toLocaleDateString('es-ES') : '—'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Button variant="ghost" size="icon" asChild>
                                                    <Link href={`/servicios/${s.id}/editar`}><Pencil className="h-4 w-4" /></Link>
                                                </Button>
                                                <DeleteServiceDialog id={s.id} nombre={s.nombre} numProgramas={s.numProgramas} />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
