import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
  } from '@/components/ui/card';
import { Skeleton } from './ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

export function TableSkeleton() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    <Skeleton className="h-8 w-1/4" />
                </CardTitle>
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead><Skeleton className="h-6 w-full" /></TableHead>
                                <TableHead><Skeleton className="h-6 w-full" /></TableHead>
                                <TableHead><Skeleton className="h-6 w-full" /></TableHead>
                                <TableHead><Skeleton className="h-6 w-full" /></TableHead>
                                <TableHead><Skeleton className="h-6 w-full" /></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}
