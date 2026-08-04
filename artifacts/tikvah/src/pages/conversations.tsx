import { useState } from 'react';
import { Search } from 'lucide-react';
import { Link } from 'wouter';
import { useListConversations } from '@workspace/api-client-react';
import { Shell, PageIntro, Button } from '@/components/shell';

const statusLabels: Record<string, string> = {
  awaiting_reply: 'Awaiting reply',
  responded: 'Responded',
  urgent: 'Urgent',
  archived: 'Archived',
};

const statusStyles: Record<string, string> = {
  awaiting_reply: 'bg-secondary text-foreground',
  responded: 'bg-primary/15 text-primary',
  urgent: 'bg-destructive/15 text-destructive',
  archived: 'bg-muted text-muted-foreground',
};

export function Conversations() {
  const [search, setSearch] = useState('');
  const { data: conversations = [], isLoading } = useListConversations({ search: search || undefined });

  const formatDate = (value: string | Date) =>
    new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));

  return (
    <Shell>
      <PageIntro eyebrow="Your conversations" title={<>Everything you've shared, in one place.</>}>
        Organized chronologically. Search to find something you wrote before.
      </PageIntro>
      <section className="mx-auto max-w-[900px] px-5 pb-24 sm:px-8">
        <div className="flex flex-col gap-4 border-y border-border py-5 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground sm:w-72">
            <Search size={15} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              data-testid="input-conversation-search"
              className="w-full bg-transparent outline-none placeholder:text-muted-foreground"
              placeholder="Search your conversations"
            />
          </label>
          <Button href="/dashboard" testId="button-new-conversation">Start a new conversation</Button>
        </div>

        {isLoading ? (
          <p className="py-16 text-center text-sm text-muted-foreground">Loading…</p>
        ) : conversations.length === 0 ? (
          <div className="mt-10 rounded-2xl bg-secondary/50 p-8 text-center">
            <p className="text-sm leading-6 text-muted-foreground">You haven't written to us yet.</p>
            <div className="mt-5"><Button href="/dashboard" testId="button-empty-new-conversation">Write your first entry</Button></div>
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            {conversations.map(conversation => (
              <Link
                key={conversation.id}
                href={`/conversations/${conversation.id}`}
                data-testid={`link-conversation-${conversation.id}`}
                className="block rounded-2xl border border-border bg-card p-5 transition hover:border-primary/50 hover:shadow-[var(--shadow-soft)] sm:p-6"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${statusStyles[conversation.status]}`}>
                    {statusLabels[conversation.status]}
                  </span>
                  <span className="text-xs text-muted-foreground">{formatDate(conversation.lastMessageAt)}</span>
                </div>
                <p className="mt-3 line-clamp-2 text-[15px] leading-6">{conversation.preview}</p>
                {conversation.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {conversation.tags.map(tag => (
                      <span key={tag} className="rounded-full bg-secondary px-2.5 py-1 text-[10px] text-muted-foreground">{tag}</span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>
    </Shell>
  );
}
