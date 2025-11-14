
'use client';

import { Button } from '@/components/ui/button';
import { DeploymentWithRelations } from '@/lib/data';
import { FileDown } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExportButtonProps {
  deployments: DeploymentWithRelations[];
}

export function ExportButton({ deployments }: ExportButtonProps) {
  const handleExport = () => {
    const dataToExport = deployments.map((d) => ({
      Fecha: new Date(d.fecha).toLocaleDateString(),
      Programa: d.programa.nombre,
      Entorno: d.entorno,
      Versión: d.version,
      Plataforma: d.plataforma,
      Responsable: d.responsable.nombre,
      Acción: d.accion || '',
      Comentario: d.comentario || '',
      'Tiene Swagger': d.hasSwagger ? 'Sí' : 'No',
      URL: d.url || '',
      Puerto: d.port || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Despliegues');

    // Auto-ajustar el ancho de las columnas
    const columnWidths = Object.keys(dataToExport[0] || {}).map((key) => {
        const maxLength = Math.max(
          key.length,
          ...dataToExport.map((row) => String(row[key as keyof typeof row] ?? '').length)
        );
        return { wch: maxLength + 2 }; // +2 para un poco de padding
      });
      worksheet['!cols'] = columnWidths;


    XLSX.writeFile(workbook, 'despliegues.xlsx');
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1 w-full sm:w-auto"
      onClick={handleExport}
      disabled={deployments.length === 0}
    >
      <FileDown className="h-3.5 w-3.5" />
      <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
        Exportar a Excel
      </span>
    </Button>
  );
}
