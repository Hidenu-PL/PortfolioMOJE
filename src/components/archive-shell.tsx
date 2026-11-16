import { Archive, ArrowUpRight, FileArchive, History, Plus, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';

export function ArchiveShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const isHome = location === '/';

  return (
    <div className="noise min-h-[100dvh] bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[244px] flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex h-[78px] items-center border-b border-sidebar-border px-7">
          <Link href="/" className="flex items-center gap-3" data-testid="link-brand">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
              <Archive className="h-[18px] w-[18px]" strokeWidth={2.4} />
            </span>
            <span>
              <span className="block font-serif text-[18px] font-semibold tracking-[-0.02em]">Web Archiver</span>
              <span className="eyebrow mt-0.5 block text-sidebar-foreground/55">field notes / 01</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-7" aria-label="Primary navigation">
          <p className="eyebrow px-3 pb-3 text-sidebar-foreground/42">Workspace</p>
          <Link href="/" data-testid="link-new-archive" className={cn('group mb-1 flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors', isHome ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/68 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground')}>
            <Plus className="h-4 w-4 text-sidebar-primary" />
            <span>New archive</span>
            <ArrowUpRight className="ml-auto h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-60" />
          </Link>
          <div className="mb-8 flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-sidebar-foreground/38">
            <History className="h-4 w-4" />
            <span>Archive history</span>
            <span className="eyebrow ml-auto text-sidebar-foreground/35">home</span>
          </div>

          <p className="eyebrow px-3 pb-3 text-sidebar-foreground/42">Protocol</p>
          <div className="space-y-1 px-3 text-xs leading-5 text-sidebar-foreground/52">
            <div className="flex items-start gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-sidebar-primary/75" />Respect robots.txt by default</div>
            <div className="flex items-start gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-sidebar-primary/75" />Documents are captured in place</div>
            <div className="flex items-start gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-sidebar-primary/75" />ZIPs are assembled locally</div>
          </div>
        </nav>

        <div className="border-t border-sidebar-border px-7 py-6">
          <div className="flex items-center gap-2 text-xs text-sidebar-foreground/55">
            <ShieldCheck className="h-4 w-4 text-sidebar-primary" />
            <span>Private by design</span>
          </div>
          <p className="mt-2 text-[11px] leading-4 text-sidebar-foreground/35">Crawl data is retained only for your download.</p>
        </div>
      </aside>

      <main className="min-h-[100dvh] md:pl-[244px]">
        <header className="flex h-[70px] items-center justify-between border-b border-border/70 bg-background/90 px-5 backdrop-blur md:hidden">
          <Link href="/" className="flex items-center gap-2.5" data-testid="link-mobile-brand">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground"><Archive className="h-4 w-4" /></span>
            <span className="font-serif text-[17px] font-semibold">Web Archiver</span>
          </Link>
          <Link href="/" className="flex items-center gap-1.5 text-xs font-semibold text-primary" data-testid="link-mobile-new">
            <Plus className="h-3.5 w-3.5" /> New archive
          </Link>
        </header>
        {children}
      </main>
    </div>
  );
}

export function PageHeader({ kicker, title, description, action }: { kicker: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div>
        <p className="eyebrow mb-3 text-muted-foreground">{kicker}</p>
        <h1 className="font-serif text-[clamp(2rem,4vw,3.15rem)] font-semibold leading-[0.98] tracking-[-0.045em] text-primary">{title}</h1>
        {description && <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Metric({ label, value, icon: Icon, accent = false }: { label: string; value: React.ReactNode; icon: typeof FileArchive; accent?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className={cn('grid h-9 w-9 place-items-center rounded-md', accent ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground')}><Icon className="h-4 w-4" /></span>
      <div><p className="eyebrow text-muted-foreground">{label}</p><p className="mono mt-1 text-sm font-medium text-foreground">{value}</p></div>
    </div>
  );
}