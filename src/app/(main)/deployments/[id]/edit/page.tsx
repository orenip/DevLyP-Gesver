import { DeploymentForm } from '@/components/deployments/deployment-sheet';
import { fetchDeploymentById } from '@/lib/data';
import { notFound } from 'next/navigation';

export default async function EditDeploymentPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const deployment = await fetchDeploymentById(id);

  if (!deployment) {
    notFound();
  }
  
  return <DeploymentForm deployment={deployment} />;
}