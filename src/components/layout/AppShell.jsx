import React from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { CalendarDays, LayoutDashboard, Layers, LogOut, ScrollText, Trophy, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/', label: 'Painel', icon: LayoutDashboard },
  { to: '/edital', label: 'Edital', icon: ScrollText },
  { to: '/cronograma', label: 'Agenda', icon: CalendarDays },
  { to: '/flashcards', label: 'Cards', icon: Layers },
  { to: '/progresso', label: 'Rank', icon: Trophy },
];

export default function AppShell() {
  const sair = async () => {
    await base44.auth.logout();
  };

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border/70 bg-sidebar/70 backdrop-blur-xl lg:flex">
        <Link to="/" className="flex items-center gap-3 px-6 py-6">
          <span className="flex h-10 w-10 items-center justify-center border border-primary/40 bg-primary/10 text-primary shadow-[0_0_22px_-6px_rgba(34,211,238,0.9)]">
            <Zap className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block font-display text-base font-bold uppercase tracking-[0.22em] text-primary">Sistema</span>
            <span className="block font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">Plano de estudos</span>
          </span>
        </Link>

        <nav className="flex-1 space-y-1 px-3">
          {NAV.map(({ to, label, icon: Icone }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'relative flex items-center gap-3 rounded-sm px-3 py-2.5 font-display text-sm uppercase tracking-[0.15em] transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icone className="h-4 w-4" />
                  {label}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 bg-primary shadow-[0_0_12px_2px_rgba(34,211,238,0.75)]" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={sair}
          className="m-3 flex items-center gap-3 rounded-sm px-3 py-2.5 font-display text-sm uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border/70 bg-background/85 px-4 py-3 backdrop-blur-xl lg:hidden">
          <span className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <span className="font-display text-base font-bold uppercase tracking-[0.22em] text-primary">Sistema</span>
          </span>
          <button onClick={sair} className="text-muted-foreground transition-colors hover:text-foreground" aria-label="Sair">
            <LogOut className="h-5 w-5" />
          </button>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:pb-14 lg:pt-10">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border/70 bg-background/95 backdrop-blur-xl lg:hidden">
        {NAV.map(({ to, label, icon: Icone }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 py-3 font-mono text-[10px] uppercase tracking-[0.15em] transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )
            }
          >
            <Icone className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
