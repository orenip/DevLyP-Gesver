'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { deleteServicio } from '@/lib/actions-servicios';

interface DeleteServiceDialogProps {
    id: string;
    nombre: string;
    numProgramas: number;
}

export function DeleteServiceDialog({ id, nombre, numProgramas }: DeleteServiceDialogProps) {
    const router = useRouter();
    const [isPending, setIsPending] = useState(false);

    async function handleDelete() {
        setIsPending(true);
        await deleteServicio(id);
        router.refresh();
        setIsPending(false);
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Eliminar servicio &quot;{nombre}&quot;</AlertDialogTitle>
                    <AlertDialogDescription>
                        {numProgramas > 0
                            ? `Los ${numProgramas} programa(s) asociados quedarán sin servicio pero sus despliegues no se borrarán.`
                            : 'Este servicio no tiene programas asociados.'
                        }
                        {' '}Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        {isPending ? 'Eliminando...' : 'Eliminar'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
