import { readDb, Despliegue, Programa } from '@/lib/data';
import PortsTable from '@/components/ports-table';

// Define a new interface for the processed data
export interface PortData {
  id: string;
  applicationName: string;
  preproduccionPort: string;
  produccionPort: string;
}

// Helper function to sort deployments by date descending
const sortDeploymentsByDate = (a: Despliegue, b: Despliegue) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime();

export default async function PortsPage() {
  const db = await readDb();
  const { despliegues, programas } = db;

  // Group deployments by programId
  const deploymentsByProgram = new Map<string, Despliegue[]>();
  for (const despliegue of despliegues) {
    if (!deploymentsByProgram.has(despliegue.programaId)) {
      deploymentsByProgram.set(despliegue.programaId, []);
    }
    deploymentsByProgram.get(despliegue.programaId)!.push(despliegue);
  }

  const portsData: PortData[] = [];
  // Process each program's deployments
  for (const [programaId, programDeployments] of deploymentsByProgram.entries()) {
    programDeployments.sort(sortDeploymentsByDate);

    const latestDeployment = programDeployments[0];
    if (!latestDeployment) continue;

    const programa = programas.find(p => p.id === programaId);
    if (!programa) continue;

    const preproduccionPort = programDeployments.find(d => d.entorno === 'Preproducción')?.port || 'N/A';
    const produccionPort = programDeployments.find(d => d.entorno === 'Producción')?.port || 'N/A';

    portsData.push({
      id: latestDeployment.id,
      applicationName: programa.nombre,
      preproduccionPort,
      produccionPort,
    });
  }

  return <PortsTable deployments={portsData} />;
}
