'use client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { deleteDeployment } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

interface DeleteDialogProps {
  children: React.ReactNode;
  deploymentId: string;
}

export function DeleteDialog({ children, deploymentId }: DeleteDialogProps) {
  const { toast } = useToast();
  const handleDelete = async () => {
    const result = await deleteDeployment(deploymentId);
    if (result.message) {
        toast({
            title: 'Despliegue Eliminado',
            description: result.message,
        })
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Esto eliminará permanentemente el registro de despliegue.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>Continuar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}