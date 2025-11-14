import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Summary {
    programaNombre: string;
    Preproducción: string | null;
    Producción: string | null;
}

interface SummaryViewProps {
  summary: Summary[];
}

export function SummaryView({ summary }: SummaryViewProps) {
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
        {summary.map((s) => (
          <TableRow key={s.programaNombre}>
            <TableCell className="font-medium">{s.programaNombre}</TableCell>
            <TableCell>{s.Preproducción || '-'}</TableCell>
            <TableCell>{s.Producción || '-'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
