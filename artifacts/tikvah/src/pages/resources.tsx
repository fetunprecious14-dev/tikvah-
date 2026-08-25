import { useMemo, useState } from 'react';
import { ArrowUpRight, CircleHelp, ExternalLink, Search, SlidersHorizontal, X } from 'lucide-react';
import { useListResources, useRecordResourceView, ResourceTopic, type Resource } from '@workspace/api-client-react';
import { Shell, PageIntro, Button } from '@/components/shell';

const topics: Array<{ value: 'All' | Resource['topic']; label: string }> = [
  { value: 'All', label: 'All' },
  { value: ResourceTopic.anxiety, label: 'Anxiety' },
  { value: ResourceTopic.grief, label: 'Grief' },
  { value: ResourceTopic.purpose, label: 'Purpose' },
  { value: ResourceTopic.relationships, label: 'Relationships' },
  { value: ResourceTopic.depression, label: 'Depression' },
  { value: ResourceTopic.stress, label: 'Stress' },
  { value: ResourceTopic.faith, label: 'Faith' },
  { value: ResourceTopic.healing, label: 'Healing' },
  { value: ResourceTopic['self-worth'], label: 'Self-worth' },
];

export function Resources() {
  const [topic, setTopic] = useState<(typeof topics)[number]['value']>('All');
  const [search, setSearch] = useState('');
  const [active, setActive] = useState<Resource | null>(null);
  const recordView = useRecordResourceView();

  const { data: resources = [], isLoading } = useListResources({
    search: search || undefined,
    topic: topic === 'All' ? undefined : topic,
  });

  const grouped = useMemo(() => resources, [resources]);

  const open = (resource: Resource) => {
    setActive(resource);
    recordView.mutate({ id: resource.id });
  };

  return (
    <Shell>
      <PageIntro eyebrow="A shelf for the hard days" title={<>Useful things, when you need them.</>}>
        Articles, exercises, prompts, and quiet reminders for the moments that don't fit neatly into a search box. Take one thing. Leave the rest.
      </PageIntro>
      <section className="mx-auto max-w-[1220px] px-5 pb-24 sm:px-8">
        <div className="flex flex-col gap-4 border-y border-border py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <SlidersHorizontal size={15} className="mt-2 hidden text-muted-foreground sm:block" />
            {topics.map(t => (
              <button
                key={t.value}
                onClick={() => setTopic(t.value)}
                data-testid={`button-topic-${t.value.toLowerCase()}`}
                className={`rounded-full px-3.5 py-2 text-xs transition ${topic === t.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground sm:w-64">
            <Search size={15} />
            <input value={search} onChange={e => setSearch(e.target.value)} data-testid="input-resource-search" className="w-full bg-transparent outline-none placeholder:text-muted-foreground" placeholder="Search the shelf" />
          </label>
        </div>

        {isLoading ? (
          <p className="py-20 text-center text-sm text-muted-foreground">Loading resources…</p>
        ) : grouped.length ? (
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {grouped.map(resource => (
              <button
                key={resource.id}
                onClick={() => open(resource)}
                data-testid={`card-resource-${resource.id}`}
                className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 text-left transition duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-[var(--shadow-soft)] sm:p-7"
              >
                <span className="flex items-start justify-between gap-3">
                  <span>
                    <span className="text-[10px] font-semibold uppercase tracking-[.17em] text-primary">{resource.type}</span>
                    <span className="mt-2 block font-serif text-2xl leading-tight">{resource.title}</span>
                  </span>
                  <ArrowUpRight size={18} className="shrink-0 text-muted-foreground transition group-hover:text-primary" />
                </span>
                <span className="block text-sm leading-6 text-muted-foreground">{resource.description}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <CircleHelp className="mx-auto text-muted-foreground" />
            <p className="mt-4 font-serif text-2xl">Nothing quite matches that search.</p>
            <button onClick={() => setSearch('')} className="mt-3 text-sm text-primary underline underline-offset-4" data-testid="button-clear-search">
              Clear search
            </button>
          </div>
        )}
        <div className="mx-auto mt-16 max-w-2xl border-t border-border pt-10 text-center">
          <h2 className="font-serif text-3xl">Looking for care from a person?</h2>
          <p className="mt-4 text-[15px] leading-7 text-muted-foreground">The professional directory can help you find non-emergency support and contact a provider directly.</p>
          <div className="mt-6 flex justify-center">
            <Button href="/professionals" secondary testId="button-resources-professionals">
              Find professional help
            </Button>
          </div>
        </div>
      </section>

      {active && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-foreground/20 p-5 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="max-w-lg rounded-[24px] border border-border bg-card p-7 shadow-[var(--shadow-soft)] sm:p-10">
            <div className="flex justify-end">
              <button onClick={() => setActive(null)} aria-label="Close resource" data-testid="button-close-resource" className="grid size-8 place-items-center rounded-full hover:bg-secondary">
                <X size={17} />
              </button>
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-[.17em] text-primary">
              {active.type} · {active.topic}
            </p>
            <h2 className="mt-3 font-serif text-4xl leading-tight">{active.title}</h2>
            <p className="mt-5 text-[15px] leading-7 text-muted-foreground">{active.description}</p>
            {active.body && <div className="mt-7 rounded-xl bg-secondary/70 p-5 text-sm leading-7">{active.body}</div>}
            <div className="mt-7 flex flex-wrap gap-3">
              {active.url && (
                <a
                  href={active.url}
                  target="_blank"
                  rel="noreferrer"
                  data-testid="link-resource-open"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-[13px] font-semibold text-primary-foreground transition hover:-translate-y-0.5"
                >
                  Open resource <ExternalLink size={14} />
                </a>
              )}
              <Button onClick={() => setActive(null)} secondary testId="button-close-resource-continue">
                I have enough for now
              </Button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}
