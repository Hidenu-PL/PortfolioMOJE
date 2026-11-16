import { Check, CircleDot, FileArchive, LoaderCircle, PackageCheck, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ArchiveStatus } from '@workspace/api-client-react';

const statusMeta: Record<ArchiveStatus, { label: string; detail: string; tone: string }> = {
  queued: { label: 'Queued', detail: 'Waiting for a crawl slot', tone: 'text-muted-foreground' },
  crawling: { label: 'Crawling site', detail: 'Following links and collecting files', tone: 'text-primary' },
  packaging: { label: 'Packaging files', detail: 'Preparing your downloadable ZIP', tone: 'text-primary' },
  completed: { label: 'Archive ready', detail: 'Everything is safely packed', tone: 'text-emerald-700' },
  failed: { label: 'Archive failed', detail: 'The crawl stopped before completion', tone: 'text-destructive' },
};

export function StatusBadge({ status }: { status: ArchiveStatus }) {
  const meta = statusMeta[status];
  const Icon = status === 'completed' ? Check : status === 'failed' ? TriangleAlert : status === 'packaging' ? PackageCheck : status === 'crawling' ? LoaderCircle : CircleDot;
  return (
    <span data-testid={`status-badge-${status}`} className={cn('inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card px-2.5 py-1 text-[11px] font-semibold', meta.tone)}>
      <Icon className={cn('h-3.5 w-3.5', status === 'crawling' && 'animate-spin')} />
      {meta.label}
    </span>
  );
}

export function CrawlStepper({ status }: { status: ArchiveStatus }) {
  const steps = [
    { key: 'queued', label: 'Queued' },
    { key: 'crawling', label: 'Crawling' },
    { key: 'packaging', label: 'Packaging' },
    { key: 'completed', label: 'Ready' },
  ];
  const current = status === 'failed' ? -1 : steps.findIndex((step) => step.key === status);
  return (
    <div className="grid grid-cols-4 gap-2" data-testid="status-stepper">
      {steps.map((step, index) => (
        <div key={step.key} className="min-w-0">
          <div className="flex items-center">
            <span className={cn('grid h-7 w-7 shrink-0 place-items-center rounded-full border text-[11px] font-semibold', index <= current ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground', index === current && status !== 'completed' && 'animate-pulse-soft')}>
              {index < current ? <Check className="h-3.5 w-3.5" /> : index + 1}
            </span>
            {index < steps.length - 1 && <span className={cn('h-px flex-1', index < current ? 'bg-primary' : 'bg-border')} />}
          </div>
          <span className={cn('mt-2 block truncate text-[10px] font-medium', index <= current ? 'text-primary' : 'text-muted-foreground')}>{step.label}</span>
        </div>
      ))}
    </div>
  );
}

export function StatusCopy({ status }: { status: ArchiveStatus }) {
  return <p className="mt-1 text-sm text-muted-foreground">{statusMeta[status].detail}</p>;
}