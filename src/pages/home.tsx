import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, ArrowRight, FileText, Globe2, LoaderCircle, LockKeyhole, RefreshCw, Settings2 } from 'lucide-react';
import { useCreateArchive, useListArchives, getListArchivesQueryKey, type Archive, type ArchiveInput } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ArchiveShell, PageHeader } from '@/components/archive-shell';
import { StatusBadge } from '@/components/archive-status';

const schema = z.object({
  url: z.string().trim().url('Enter a complete URL, including https://'),
  maxPages: z.coerce.number().int().min(1).max(500),
  maxDepth: z.coerce.number().int().min(0).max(10),
  includeDocuments: z.boolean(),
  respectRobots: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

function formatBytes(bytes: number) {
  if (!bytes) return '—';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function relativeDate(date: string) {
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return 'Date unavailable';
  const diff = Date.now() - value.getTime();
  const hours = Math.floor(diff / 36e5);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  if (hours < 48) return 'Yesterday';
  return value.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function RecentArchive({ archive }: { archive: Archive }) {
  return (
    <Link href={`/archive/${archive.id}`} data-testid={`link-archive-${archive.id}`} className="group grid gap-4 border-b border-border/70 px-1 py-4 transition-colors hover:bg-secondary/30 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-secondary text-secondary-foreground"><Globe2 className="h-4 w-4" /></span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-primary group-hover:underline group-hover:underline-offset-4">{archive.domain || archive.url}</p>
          <p className="mono mt-1 truncate text-[11px] text-muted-foreground">{archive.url}</p>
        </div>
      </div>
      <div className="flex items-center gap-4 pl-12 text-[11px] text-muted-foreground sm:pl-0">
        <span><strong className="font-semibold text-foreground">{archive.pages}</strong> pages</span>
        <span><strong className="font-semibold text-foreground">{archive.documents}</strong> docs</span>
        <span>{formatBytes(archive.totalBytes)}</span>
      </div>
      <div className="flex items-center justify-between pl-12 sm:block sm:pl-0 sm:text-right">
        <StatusBadge status={archive.status} />
        <p className="mt-1 text-[10px] text-muted-foreground">{relativeDate(archive.createdAt)}</p>
      </div>
    </Link>
  );
}

export default function Home() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const archivesQuery = useListArchives({ query: { queryKey: getListArchivesQueryKey(), staleTime: 15_000 } });
  const createArchive = useCreateArchive();
  const archives = useMemo(() => archivesQuery.data ?? [], [archivesQuery.data]);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { url: '', maxPages: 100, maxDepth: 3, includeDocuments: true, respectRobots: true },
  });

  const submit = (values: FormValues) => {
    const payload: ArchiveInput = { url: values.url, maxPages: values.maxPages, maxDepth: values.maxDepth, includeDocuments: values.includeDocuments, respectRobots: values.respectRobots };
    createArchive.mutate({ data: payload }, {
      onSuccess: (archive) => {
        queryClient.invalidateQueries({ queryKey: getListArchivesQueryKey() });
        setLocation(`/archive/${archive.id}`);
      },
    });
  };

  return (
    <ArchiveShell>
      <div className="archive-grid min-h-[calc(100dvh-70px)] px-5 py-8 md:min-h-[100dvh] md:px-10 md:py-12 lg:px-16">
        <div className="mx-auto max-w-[1180px]">
          <PageHeader kicker="Workspace / New capture" title="Keep the whole record." description="Enter a starting URL and Web Archiver will make a faithful, self-contained copy — pages, linked documents, and the structure between them." />

          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.17fr)_minmax(330px,.83fr)] xl:items-start">
            <section className="rounded-xl border border-card-border bg-card p-5 shadow-sm sm:p-7" data-testid="card-start-archive">
              <div className="mb-7 flex items-start justify-between gap-4 border-b border-border/70 pb-5">
                <div>
                  <p className="eyebrow text-accent-foreground/70">Capture parameters</p>
                  <h2 className="mt-2 font-serif text-2xl font-semibold tracking-[-0.03em] text-primary">Start a new archive</h2>
                </div>
                <span className="hidden h-11 w-11 place-items-center rounded-full bg-accent/70 text-accent-foreground sm:grid"><Globe2 className="h-5 w-5" /></span>
              </div>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(submit)} className="space-y-6" data-testid="form-start-archive">
                  <FormField control={form.control} name="url" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-primary">Starting URL</FormLabel>
                      <FormControl><div className="relative"><Globe2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input {...field} data-testid="input-archive-url" className="h-12 border-input bg-background pl-10 font-mono text-sm" placeholder="https://example.org" /></div></FormControl>
                      <FormDescription>We will stay within this domain while following internal links.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="grid gap-5 sm:grid-cols-2">
                    <FormField control={form.control} name="maxPages" render={({ field }) => (
                      <FormItem><FormLabel className="text-xs font-semibold text-primary">Page limit</FormLabel><FormControl><Input {...field} onChange={(event) => field.onChange(event.target.value)} data-testid="input-max-pages" type="number" min={1} max={500} className="h-11 bg-background font-mono" /></FormControl><FormDescription>Maximum HTML pages to capture.</FormDescription><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="maxDepth" render={({ field }) => (
                      <FormItem><FormLabel className="text-xs font-semibold text-primary">Link depth</FormLabel><FormControl><Input {...field} onChange={(event) => field.onChange(event.target.value)} data-testid="input-max-depth" type="number" min={0} max={10} className="h-11 bg-background font-mono" /></FormControl><FormDescription>How far links may branch from the start.</FormDescription><FormMessage /></FormItem>
                    )} />
                  </div>

                  <div className="space-y-1 divide-y divide-border/70 rounded-lg border border-border/80 bg-background/50">
                    <FormField control={form.control} name="includeDocuments" render={({ field }) => (
                      <FormItem className="flex items-center justify-between gap-4 px-4 py-3.5"><div><FormLabel className="text-sm font-medium text-primary">Include linked documents</FormLabel><FormDescription>PDFs, spreadsheets, and other downloadable files.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-include-documents" /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="respectRobots" render={({ field }) => (
                      <FormItem className="flex items-center justify-between gap-4 px-4 py-3.5"><div><FormLabel className="text-sm font-medium text-primary">Respect robots.txt</FormLabel><FormDescription>Honor the site’s crawl preferences.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-respect-robots" /></FormControl></FormItem>
                    )} />
                  </div>

                  {createArchive.isError && <div role="alert" data-testid="alert-create-error" className="flex gap-2.5 rounded-lg border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><p>We couldn’t start that archive. Check the URL and try again.</p></div>}
                  <Button disabled={createArchive.isPending} type="submit" data-testid="button-start-archive" className="h-11 w-full bg-primary font-semibold text-primary-foreground shadow-sm hover:bg-primary/90">
                    {createArchive.isPending ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Preparing crawl…</> : <>Start archive <ArrowRight className="h-4 w-4" /></>}
                  </Button>
                  <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground"><LockKeyhole className="h-3.5 w-3.5" /> Your crawl is private and available only to you.</p>
                </form>
              </Form>
            </section>

            <section className="xl:pt-1">
              <div className="mb-4 flex items-end justify-between">
                <div><p className="eyebrow text-muted-foreground">Recent activity</p><h2 className="mt-2 font-serif text-2xl font-semibold tracking-[-0.03em] text-primary">Your archives</h2></div>
                <span className="mono text-xs text-muted-foreground" data-testid="text-archive-count">{archives.length.toString().padStart(2, '0')} total</span>
              </div>
              <div className="rounded-xl border border-card-border bg-card px-4 shadow-sm sm:px-5">
                {archivesQuery.isLoading && <div className="space-y-4 py-5" data-testid="loading-archives">{[1, 2, 3].map((item) => <div key={item} className="flex animate-pulse items-center gap-3"><div className="h-9 w-9 rounded-md bg-muted" /><div className="flex-1 space-y-2"><div className="h-3 w-2/3 rounded bg-muted" /><div className="h-2 w-1/3 rounded bg-muted" /></div></div>)}</div>}
                {archivesQuery.isError && <div className="flex flex-col items-center px-5 py-12 text-center" data-testid="empty-archives-error"><AlertCircle className="h-7 w-7 text-destructive" /><p className="mt-3 text-sm font-semibold">History is unavailable</p><p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">We couldn’t load your recent archives right now.</p><Button variant="outline" size="sm" onClick={() => archivesQuery.refetch()} data-testid="button-retry-archives" className="mt-5"><RefreshCw className="h-3.5 w-3.5" /> Try again</Button></div>}
                {!archivesQuery.isLoading && !archivesQuery.isError && archives.length === 0 && <div className="flex flex-col items-center px-5 py-14 text-center" data-testid="empty-archives"><span className="grid h-12 w-12 place-items-center rounded-full bg-secondary text-secondary-foreground"><FileText className="h-5 w-5" /></span><p className="mt-4 font-serif text-lg font-semibold text-primary">No captures yet</p><p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">Your completed and in-progress archives will appear here.</p></div>}
                {!archivesQuery.isLoading && !archivesQuery.isError && archives.length > 0 && <div data-testid="list-archives">{archives.map((archive) => <RecentArchive key={archive.id} archive={archive} />)}</div>}
              </div>
              <div className="mt-6 rounded-lg border border-dashed border-border/90 p-4"><div className="flex gap-3"><Settings2 className="mt-0.5 h-4 w-4 text-muted-foreground" /><div><p className="text-xs font-semibold text-primary">A note on scope</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Archives follow same-domain links only. Set a higher depth when a site has nested sections.</p></div></div></div>
            </section>
          </div>
          <footer className="mt-12 flex flex-col gap-2 border-t border-border/60 pt-4 text-[10px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><span className="eyebrow">Web Archiver / dependable local copies</span><span className="mono">v1.0 · crawl protocol active</span></footer>
        </div>
      </div>
    </ArchiveShell>
  );
}