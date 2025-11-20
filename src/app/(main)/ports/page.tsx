import { repository } from '@/lib/repository';
import PortsTable from '@/components/ports-table';

// Define the interface for the processed data, which is what PortsTable expects
export interface PortData {
  id: string;
  applicationName: string;
  preproduccionPort: string;
  produccionPort: string;
}

export default async function PortsPage() {
  // Fetch the summary data from the repository, which connects to the database
  const summaryItems = await repository.getSummary();

  // Map the summary data to the format expected by the PortsTable component
  const portsData: PortData[] = summaryItems.map(item => ({
    id: item.programaId,
    applicationName: item.programaNombre,
    preproduccionPort: item.Preproducción?.port || 'N/A',
    produccionPort: item.Producción?.port || 'N/A',
  }));

  return <PortsTable deployments={portsData} />;
}
