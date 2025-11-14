import { DeploymentForm } from '@/components/deployments/deployment-sheet';
import { repository } from '@/lib/repository';
import { notFound } from 'next/navigation';

export default async function EditDeploymentPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const deployment = await repository.getDeploymentById(id);

  if (!deployment) {
    notFound();
  }
  
  return <DeploymentForm deployment={deployment} />;
}
