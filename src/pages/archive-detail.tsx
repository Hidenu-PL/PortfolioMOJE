import { useMemo } from 'react';
import { Link, useParams } from 'wouter';
import { AlertCircle, ArrowLeft, Check, Download, FileArchive, FileText, Folder, Globe2, HardDrive, LoaderCircle, RefreshCw, ServerCrash } from 'lucide-react';
import { getDownloadArchiveQueryKey, getGetArchiveQueryKey, useDownloadArchive, useGetArchive } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArchiveShell, Metric, PageHeader } from '@/components/archive-shell';
import { CrawlStepper, StatusBadge, StatusCopy } from '@/components/archive-status';
import { cn } from '@/lib/utils';

function formatBytes(bytes: number) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function dateLabel(date: string | null) {
  if (!date) return '—';
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function ArchiveDetail() {
  const { id = '' } = useParams<{ id: string }>();
  const archiveQuery = useGetArchive(id, { query: { enabled: Boolean(id), queryKey: getGetArchiveQueryKey(id), refetchInterval: (query) => {
    const status = query.state.data?.status;
    return status && ['queued', 'crawling', 'packaging'].includes(status) ? 2500 : false;
  } } });
  const downloadQuery = useDownloadArchive(id, { query: { enabled: false, queryKey: getDownloadArchiveQueryKey(id) } });
  const archive = archiveQuery.data;
  const manifest = useMemo(() => {
    if (!archive) return [];
    return [
      { name: 'index.html', detail: 'Archive entry point', type: 'HTML', icon: Globe2 },
      { name: 'pages/', detail: `${archive.pages} captured page${archive.pages === 1 ? '' : 's'}`, type: 'DIRECTORY', icon: Folder },
      { name: 'documents/', detail: `${archive.documents} linked document${archive.documents === 1 ? '' : 's'}`, type: 'DIRECTORY', icon: Folder },
      { name: 'archive-manifest.json', detail: 'Capture metadata and crawl map', type: 'JSON', icon: FileText },
    ];
  }, [archive]);

  const handleDownload = async () => {
    const result = await downloadQuery.refetch();
    if (result.data instanceof Blob) {
      const url = URL.createObjectURL(result.data);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${archive?.domain || 'web-archive'}.zip`;
      anchor.click();
      URL.revokeObjectURL(url);
    }
  };

  if (archiveQuery.isLoading) {
    return <ArchiveShell><div className="archive-grid min-h-[calc(100dvh-70px)] px-5 py-8 md:min-h-[100dvh] md:px-10 md:py-12 lg:px-16"><div className="mx-auto max-w-[1180px] animate-pulse"><div className="h-3 w-24 rounded bg-muted" /><div className="mt-4 h-12 w-80 rounded bg-muted" /><div className="mt-3 h-4 w-96 max-w-full rounded bg-muted" /><div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_.8fr]"><div className="h-72 rounded-xl bg-muted" /><div className="h-72 rounded-xl bg-muted" /></div></div></div></ArchiveShell>;
  }

  if (archiveQuery.isError || !archive) {
    return <ArchiveShell><div className="archive-grid flex min-h-[calc(100dvh-70px)] items-center justify-center px-5 py-12 md:min-h-[100dvh]"><div className="max-w-md rounded-xl border border-destructive/20 bg-card p-8 text-center shadow-sm" data-testid="state-archive-error"><span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-destructive/10 text-destructive"><ServerCrash className="h-6 w-6" /></span><h1 className="mt-5 font-serif text-2xl font-semibold text-primary">Archive not available</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">This archive may have expired, or the crawl service is unavailable.</p><div className="mt-6 flex justify-center gap-3"><Button variant="outline" onClick={() => archiveQuery.refetch()} data-testid="button-retry-archive"><RefreshCw className="h-4 w-4" /> Try again</Button><Link href="/" className="inline-flex min-h-9 items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" data-testid="link-back-home"><ArrowLeft className="h-4 w-4" /> Back home</Link></div></div></div></ArchiveShell>;
  }

  const isActive = archive.status !== 'completed' && archive.status !== 'failed';
  const progress = Math.max(0, Math.min(100, archive.progress ?? 0));
  return (
    <ArchiveShell>
      <div className="archive-grid min-h-[calc(100dvh-70px)] px-5 py-8 md:min-h-[100dvh] md:px-10 md:py-12 lg:px-16">
        <div className="mx-auto max-w-[1180px]">
          <Link href="/" className="mb-8 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary" data-testid="link-back-to-archives"><ArrowLeft className="h-3.5 w-3.5" /> All archives</Link>
          <PageHeader kicker={`Archive / ${archive.id.slice(0, 8)}`} title={archive.domain || 'Website archive'} description={archive.url} action={<StatusBadge status={archive.status} />} />

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.16fr)_minmax(330px,.84fr)]">
            <section className="rounded-xl border border-card-border bg-card p-5 shadow-sm sm:p-7" data-testid="card-archive-progress">
              <div className="flex items-start justify-between gap-4">
                <div><p className="eyebrow text-muted-foreground">Capture progress</p><h2 className="mt-2 font-serif text-2xl font-semibold tracking-[-0.03em] text-primary">{archive.status === 'completed' ? 'The record is ready.' : archive.status === 'failed' ? 'The crawl needs attention.' : 'Building your copy.'}</h2><StatusCopy status={archive.status} /></div>
                <span className={cn('grid h-11 w-11 place-items-center rounded-full', archive.status === 'failed' ? 'bg-destructive/10 text-destructive' : archive.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-accent/70 text-accent-foreground')}>{archive.status === 'completed' ? <Check className="h-5 w-5" /> : archive.status === 'failed' ? <AlertCircle className="h-5 w-5" /> : <LoaderCircle className="h-5 w-5 animate-spin" />}</span>
              </div>
              <div className="mt-8"><div className="mb-2 flex items-end justify-between"><span className="eyebrow text-muted-foreground">Overall completion</span><span className="mono text-xl font-medium text-primary" data-testid="text-archive-progress">{progress}%</span></div><Progress value={progress} className="h-3 bg-secondary" /></div>
              <div className="mt-9 border-t border-border/70 pt-6"><CrawlStepper status={archive.status} /></div>
              {archive.status === 'failed' && <div role="alert" data-testid="alert-archive-failed" className="mt-7 flex gap-3 rounded-lg border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><div><p className="font-semibold">Crawl stopped</p><p className="mt-1 leading-5">{archive.error || 'The site could not be archived completely.'}</p></div></div>}
              {archive.status === 'completed' && <Button onClick={handleDownload} disabled={downloadQuery.isFetching} data-testid="button-download-archive" className="mt-8 h-11 w-full bg-primary font-semibold text-primary-foreground hover:bg-primary/90">{downloadQuery.isFetching ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Preparing download…</> : <><Download className="h-4 w-4" /> Download ZIP</>}</Button>}
              {downloadQuery.isError && <p role="alert" className="mt-3 text-center text-xs text-destructive" data-testid="alert-download-error">Download could not be prepared. Please try again.</p>}
            </section>

            <section className="rounded-xl border border-card-border bg-card p-5 shadow-sm sm:p-7" data-testid="card-crawl-stats">
              <div className="mb-6 border-b border-border/70 pb-5"><p className="eyebrow text-muted-foreground">Crawl ledger</p><h2 className="mt-2 font-serif text-2xl font-semibold tracking-[-0.03em] text-primary">What we found</h2></div>
              <div className="grid grid-cols-2 gap-x-5 gap-y-7">
                <Metric label="Pages" value={archive.pages} icon={Globe2} accent />
                <Metric label="Documents" value={archive.documents} icon={FileText} />
                <Metric label="Total size" value={formatBytes(archive.totalBytes)} icon={HardDrive} />
                <Metric label="Finished" value={dateLabel(archive.finishedAt)} icon={Check} />
              </div>
              <div className="mt-8 rounded-lg bg-secondary/55 p-4"><div className="flex items-center gap-2"><FileArchive className="h-4 w-4 text-primary" /><p className="text-xs font-semibold text-primary">Self-contained package</p></div><p className="mt-1.5 text-xs leading-5 text-muted-foreground">Links, documents, and capture metadata are arranged so the archive can be opened and understood offline.</p></div>
            </section>
          </div>

          <section className="mt-6 rounded-xl border border-card-border bg-card p-5 shadow-sm sm:p-7" data-testid="card-file-manifest">
            <div className="mb-5 flex flex-col justify-between gap-3 border-b border-border/70 pb-5 sm:flex-row sm:items-end"><div><p className="eyebrow text-muted-foreground">Package contents</p><h2 className="mt-2 font-serif text-2xl font-semibold tracking-[-0.03em] text-primary">File manifest</h2></div><span className="mono text-[11px] text-muted-foreground">{archive.status === 'completed' ? 'ready to inspect' : isActive ? 'updating with crawl' : 'partial capture'}</span></div>
            <div className="overflow-hidden rounded-lg border border-border/70">
              {manifest.map((file, index) => { const Icon = file.icon; return <div key={file.name} data-testid={`row-manifest-${index}`} className="flex items-center gap-3 border-b border-border/60 px-3.5 py-3 last:border-0 sm:px-4"><span className="grid h-8 w-8 place-items-center rounded-md bg-secondary text-secondary-foreground"><Icon className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="mono truncate text-xs font-medium text-primary">{file.name}</p><p className="mt-0.5 text-[11px] text-muted-foreground">{file.detail}</p></div><span className="mono hidden text-[10px] text-muted-foreground sm:block">{file.type}</span></div>; })}
            </div>
            <p className="mt-4 flex items-center gap-2 text-[11px] text-muted-foreground"><FileArchive className="h-3.5 w-3.5" /> Manifest updates as the server reports new crawl results.</p>
          </section>
          <footer className="mt-10 flex flex-col gap-2 border-t border-border/60 pt-4 text-[10px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><span className="eyebrow">Archive ID / {archive.id}</span><span className="mono">Started {dateLabel(archive.createdAt)}</span></footer>
        </div>
      </div>
    </ArchiveShell>
  );
}