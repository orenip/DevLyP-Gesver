'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { SERVICE_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface ServiceFormProps {
    action: (formData: FormData) => Promise<{ message: string; errors?: Record<string, string[]> }>;
    defaultValues?: {
        nombre?: string;
        descripcion?: string;
        color?: string;
    };
    submitLabel: string;
}

export function ServiceForm({ action, defaultValues, submitLabel }: ServiceFormProps) {
    const router = useRouter();
    const [selectedColor, setSelectedColor] = useState<string>(defaultValues?.color || SERVICE_COLORS[0]);
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsPending(true);
        setError(null);
        const formData = new FormData(e.currentTarget);
        formData.set('color', selectedColor);
        const result = await action(formData);
        setIsPending(false);
        if (result.message.startsWith('Error')) {
            setError(result.message);
        } else {
            router.push('/servicios');
            router.refresh();
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
            <div className="space-y-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input id="nombre" name="nombre" required defaultValue={defaultValues?.nombre} placeholder="Ej: ArcoNet" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea id="descripcion" name="descripcion" defaultValue={defaultValues?.descripcion ?? ''} placeholder="Descripción opcional del servicio" rows={3} />
            </div>
            <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                    {SERVICE_COLORS.map(color => (
                        <button key={color} type="button" onClick={() => setSelectedColor(color)}
                            className={cn('h-8 w-8 rounded-full border-2 transition-all', selectedColor === color ? 'border-foreground scale-110' : 'border-transparent')}
                            style={{ backgroundColor: color }} title={color} />
                    ))}
                </div>
                <p className="text-xs text-muted-foreground">Color seleccionado: {selectedColor}</p>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-3">
                <Button type="submit" disabled={isPending}>{isPending ? 'Guardando...' : submitLabel}</Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
            </div>
        </form>
    );
}
