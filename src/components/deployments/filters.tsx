'use client';

import { Input } from '../ui/input';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select';
import { Programa, Responsable } from '@prisma/client';

export function Filters({ programs, responsibles }: { programs: Programa[], responsibles: Responsable[]}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set('query', term);
    } else {
      params.delete('query');
    }
    replace(`${pathname}?${params.toString()}`);
  }, 300);

  const handleFilterChange = (key: string) => (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-4 mt-4">
        <Input
          type="search"
          placeholder="Buscar despliegues..."
          className="w-full"
          onChange={(e) => handleSearch(e.target.value)}
          defaultValue={searchParams.get('query')?.toString()}
        />
        <Select onValueChange={handleFilterChange('entorno')} defaultValue={searchParams.get('entorno') || 'all'}>
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Entorno" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Todos los Entornos</SelectItem>
                <SelectItem value="Preproducción">Preproducción</SelectItem>
                <SelectItem value="Producción">Producción</SelectItem>
            </SelectContent>
        </Select>
        <Select onValueChange={handleFilterChange('programaId')} defaultValue={searchParams.get('programaId') || 'all'}>
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Programa" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Todos los Programas</SelectItem>
                {programs.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.nombre}</SelectItem>)}
            </SelectContent>
        </Select>
        <Select onValueChange={handleFilterChange('responsableId')} defaultValue={searchParams.get('responsableId') || 'all'}>
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Responsable" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Todos los Responsables</SelectItem>
                {responsibles.map(r => <SelectItem key={r.id} value={r.id.toString()}>{r.nombre}</SelectItem>)}
            </SelectContent>
        </Select>
    </div>
  );
}
