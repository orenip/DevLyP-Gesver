'use client';

import { BarChart3, LayoutGrid, PanelLeft, Rocket, Wifi } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const navLinks = [
  {
    href: '/estadisticas',
    icon: BarChart3,
    label: 'Estadísticas',
    desc: 'Métricas y rankings',
  },
  {
    href: '/servicios',
    icon: LayoutGrid,
    label: 'Servicios',
    desc: 'Catálogo de aplicaciones',
  },
  {
    href: '/deployments',
    icon: Rocket,
    label: 'Despliegues',
    desc: 'Registrar y consultar deploys',
  },
  {
    href: '/ports',
    icon: Wifi,
    label: 'Puertos',
    desc: 'Asignaciones de puerto',
  },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + '/');
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleMobileLinkClick = (href: string) => {
    startTransition(() => {
      router.push(href);
      setOpen(false);
    });
  };

  return (
    <div className="flex min-h-screen w-full bg-muted/30">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-56 flex-col border-r bg-background shadow-sm sm:flex">
        <div className="flex h-14 items-center border-b px-4 gap-3">
          <img
            src="/arcotools-logo.png"
            alt="ArcoTools logo"
            width={32}
            height={32}
            className="flex-shrink-0 object-contain"
          />
          <div>
            <p className="font-bold text-sm leading-tight">ArcoVer</p>
            <p className="text-[10px] text-muted-foreground leading-tight">Control de versiones</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1 p-3 flex-1 overflow-y-auto">
          <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
            Navegación
          </p>
          {navLinks.map(({ href, icon: Icon, label, desc }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-150 group',
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 flex-shrink-0 transition-transform duration-150',
                    active ? 'text-primary-foreground' : 'group-hover:scale-110'
                  )}
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium leading-tight">{label}</span>
                  <span
                    className={cn(
                      'text-[11px] leading-tight truncate',
                      active ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    )}
                  >
                    {desc}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="border-t px-4 py-3">
          <p className="text-[10px] text-muted-foreground">Arco Valoraciones · {new Date().getFullYear()}</p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 sm:ml-56 min-h-screen">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background px-4 sm:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline">
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetTitle className="sr-only">Navegación</SheetTitle>
              <div className="flex h-14 items-center border-b px-4 gap-3">
                <img
                  src="/arcotools-logo.png"
                  alt="ArcoTools logo"
                  width={28}
                  height={28}
                  className="flex-shrink-0 object-contain"
                />
                <span className="font-bold text-sm">ArcoVer</span>
              </div>
              <nav className="flex flex-col gap-1 p-3">
                {navLinks.map(({ href, icon: Icon, label, desc }) => {
                  const active = isActive(pathname, href);
                  return (
                    <button
                      key={href}
                      onClick={() => handleMobileLinkClick(href)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-left w-full transition-all',
                        active
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-medium">{label}</div>
                        <div
                          className={cn(
                            'text-[11px]',
                            active ? 'text-primary-foreground/70' : 'text-muted-foreground'
                          )}
                        >
                          {desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <img
              src="/arcotools-logo.png"
              alt="ArcoTools logo"
              width={24}
              height={24}
              className="flex-shrink-0 object-contain"
            />
            <span className="font-semibold text-sm">ArcoVer</span>
          </div>
          {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground ml-auto" />}
        </header>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
