import { Rocket } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-2 text-primary">
      <Rocket className="h-6 w-6" />
      <span className="text-lg font-semibold">Deployment Tracker</span>
    </div>
  );
}
