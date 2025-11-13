'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Entorno, EntornoLabel, Programa, Responsable } from '@/lib/definitions';
import { DeploymentSheet } from './deployment-sheet';
import { Button } from '../ui/button';
import { downloadCsv, generateCsv } from '@/lib/utils';

interface DataTableToolbarProps {
  programs: Programa[];
  responsibles: Responsable[];
  deployments: any[];
}

export function DataTableToolbar({ programs, responsibles, deployments }: DataTableToolbarProps) {
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

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    replace(`${pathname}?${params.toString()}`);
  };

  const handleExport = () => {
    const dataToExport = deployments.map(d => ({
        fecha: d.fecha,
        programa: d.programa.nombre,
        entorno: d.entorno,
        version: d.version,
        accion: d.accion,
        responsable: d.responsable.nombre,
        comentario: d.comentario,
    }));
    const csv = generateCsv(dataToExport);
    downloadCsv(csv, `despliegues-${new Date().toISOString().split('T')[0]}.csv`);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
      <div className="w-full sm:w-auto flex-grow">
        <Input
          placeholder="Buscar en despliegues..."
          defaultValue={searchParams.get('query')?.toString()}
          onChange={(e) => handleSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
        <Select
          value={searchParams.get('programaId') || ''}
          onValueChange={(value) => handleFilterChange('programaId', value)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filtrar por programa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos los programas</SelectItem>
            {programs.map((p) => (
              <SelectItem key={p.id} value={p.id.toString()}>{p.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={searchParams.get('responsableId') || ''}
          onValueChange={(value) => handleFilterChange('responsableId', value)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filtrar por responsable" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos los responsables</SelectItem>
            {responsibles.map((r) => (
              <SelectItem key={r.id} value={r.id.toString()}>{r.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={searchParams.get('entorno') || ''}
          onValueChange={(value) => handleFilterChange('entorno', value)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filtrar por entorno" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos los entornos</SelectItem>
            {Object.values(Entorno).map((e) => (
              <SelectItem key={e} value={e}>{EntornoLabel[e]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="w-full sm:w-auto flex gap-2 justify-end">
        <Button variant="outline" onClick={handleExport}>Exportar CSV</Button>
        <DeploymentSheet programs={programs} responsibles={responsibles}/>
      </div>
    </div>
  );
}
