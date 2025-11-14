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
import { Programa, Responsable } from '@/lib/data';


export function Filters({ programs, responsibles }: { programs: Programa[], responsibles: Responsable[]}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', '1');
    if (term) {
      params.set('query', term);
    } else {
      params.delete('query');
    }
    replace(`${pathname}?${params.toString()}`);
  }, 300);

  const handleFilterChange = (key: string) => (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', '1');
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-4 pt-4">
      <Input
        type="search"
        placeholder="Buscar despliegues..."
        className="w-full"
        onChange={(e) => handleSearch(e.target.value)}
        defaultValue={searchParams.get('query')?.toString()}
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select onValueChange={handleFilterChange('entorno')} defaultValue={searchParams.get('entorno') || 'all'}>
              <SelectTrigger>
                  <SelectValue placeholder="Entorno" />
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="all">Todos los Entornos</SelectItem>
                  <SelectItem value="Preproducción">Preproducción</SelectItem>
                  <SelectItem value="Producción">Producción</SelectItem>
              </SelectContent>
          </Select>
          <Select onValueChange={handleFilterChange('programaId')} defaultValue={searchParams.get('programaId') || 'all'}>
              <SelectTrigger>
                  <SelectValue placeholder="Programa" />
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="all">Todos los Programas</SelectItem>
                  {programs.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}
              </SelectContent>
          </Select>
          <Select onValueChange={handleFilterChange('responsableId')} defaultValue={searchParams.get('responsableId') || 'all'}>
              <SelectTrigger>
                  <SelectValue placeholder="Responsable" />
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="all">Todos los Responsables</SelectItem>
                  {responsibles.map(r => <SelectItem key={r.id} value={r.id}>{r.nombre}</SelectItem>)}
              </SelectContent>
          </Select>
      </div>
    </div>
  );
}
