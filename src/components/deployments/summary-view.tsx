import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Summary {
  programaId: number;
  entorno: string;
  _max: {
    version: string | null;
  };
  programaNombre: string;
}

interface SummaryViewProps {
  summary: Summary[];
}

export function SummaryView({ summary }: SummaryViewProps) {
    const groupedByProgram = summary.reduce((acc, curr) => {
        if (!acc[curr.programaNombre]) {
            acc[curr.programaNombre] = {};
        }
        acc[curr.programaNombre][curr.entorno] = curr._max.version;
        return acc;
    }, {} as Record<string, Record<string, string | null>>);


  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Programa</TableHead>
          <TableHead>Última Versión en Preproducción</TableHead>
          <TableHead>Última Versión en Producción</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Object.entries(groupedByProgram).map(([programa, entornos]) => (
          <TableRow key={programa}>
            <TableCell className="font-medium">{programa}</TableCell>
            <TableCell>{entornos['Preproducción'] || '-'}</TableCell>
            <TableCell>{entornos['Producción'] || '-'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
