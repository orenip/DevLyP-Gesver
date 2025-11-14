import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
    text?: string;
}

export function LoadingSpinner({ text = "Cargando..." }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col justify-center items-center h-64">
      <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
      <p className="text-lg text-muted-foreground">{text}</p>
    </div>
  );
}
