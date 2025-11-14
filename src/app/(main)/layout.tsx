'use client';

import { Home, Package } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
        <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/"
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${pathname === '/' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'} transition-colors hover:text-foreground md:h-8 md:w-8`}
                >
                  <Home className="h-5 w-5" />
                  <span className="sr-only">Resumen</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Resumen</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/deployments"
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${pathname.startsWith('/deployments') ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'} transition-colors hover:text-foreground md:h-8 md:w-8`}
                >
                  <Package className="h-5 w-5" />
                  <span className="sr-only">Despliegues</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Despliegues</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </nav>
      </aside>
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
            <nav className="sm:hidden">
                <Link href="/" className={`p-2 ${pathname === '/' ? 'text-foreground' : 'text-muted-foreground'}`}>
                    <Home className="h-6 w-6" />
                    <span className="sr-only">Resumen</span>
                </Link>
                <Link href="/deployments" className={`p-2 ${pathname.startsWith('/deployments') ? 'text-foreground' : 'text-muted-foreground'}`}>
                    <Package className="h-6 w-6" />
                    <span className="sr-only">Despliegues</span>
                </Link>
            </nav>
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          {children}
        </main>
      </div>
    </div>
  );
}
