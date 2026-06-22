'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Settings2 } from 'lucide-react';
import { updateAsociaciones } from '@/lib/actions-servicios';
import type { ProgramaConServicio } from '@/lib/repository';
import { Input } from '@/components/ui/input';

interface AsociacionesModalProps {
    servicioId: string;
    todosLosProgramas: ProgramaConServicio[];
    programasAsociados: string[];
}

export function AsociacionesModal({ servicioId, todosLosProgramas, programasAsociados }: AsociacionesModalProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState<Set<string>>(new Set(programasAsociados));
    const [search, setSearch] = useState('');
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const filtered = todosLosProgramas.filter(p => p.nombre.toLowerCase().includes(search.toLowerCase()));

    function toggle(id: string) {
        setSelected(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }

    function handleSave() {
        startTransition(async () => {
            const result = await updateAsociaciones(servicioId, Array.from(selected), todosLosProgramas);
            if (result.message.startsWith('Error')) {
                setError(result.message);
            } else {
                setOpen(false);
                router.refresh();
            }
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm"><Settings2 className="mr-2 h-4 w-4" />Gestionar programas</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
                <DialogHeader><DialogTitle>Gestionar programas asociados</DialogTitle></DialogHeader>
                <Input placeholder="Buscar programa..." value={search} onChange={e => setSearch(e.target.value)} className="mt-2" />
                <div className="flex-1 overflow-y-auto space-y-2 my-2 pr-1">
                    {filtered.map(programa => (
                        <div key={programa.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted">
                            <Checkbox id={`prog-${programa.id}`} checked={selected.has(programa.id)} onCheckedChange={() => toggle(programa.id)} />
                            <Label htmlFor={`prog-${programa.id}`} className="cursor-pointer flex-1">
                                {programa.nombre}
                                {programa.servicioId && programa.servicioId !== servicioId && (
                                    <span className="ml-2 text-xs text-muted-foreground">(en otro servicio)</span>
                                )}
                            </Label>
                        </div>
                    ))}
                    {filtered.length === 0 && <p className="text-center text-muted-foreground text-sm py-4">Sin resultados</p>}
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={isPending}>
                        {isPending ? 'Guardando...' : `Guardar (${selected.size} seleccionados)`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
