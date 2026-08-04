import { useState } from 'react';
import { Search } from 'lucide-react';
import { Link } from 'wouter';
import { useAdminListConversations, ConversationStatus } from '@workspace/api-client-react';
import { Shell, PageIntro } from '@/components/shell';
import { AdminNav } from './admin-nav';

const filters: Array<{ value: 'all' | (typeof ConversationStatus)[keyof typeof ConversationStatus]; label: string }> = [
  { value: 'all', label: 'All' },
  { value: ConversationStatus.urgent, label: 'Urgent' },
  { value: ConversationStatus.awaiting_reply, label: 'Awaiting reply' },
  { value: ConversationStatus.responded, label: 'Responded' },
  { value: ConversationStatus.archived, label: 'Archived' },
];

const statusStyles: Record<string, string> = {
  awaiting_reply: 'bg-secondary text-foreground',
  responded: 'bg-primary/15 text-primary',
  urgent: 'bg-destructive/15 text-destructive',
  archived: 'bg-muted text-muted-foreground',
};

export function AdminInbox() {
  const [status, setStatus] = useState<(typeof filters)[number]['value']>('all');
  const [search, setSearch] = useState('');

  const { data: conversations = [], isLoading } = useAdminListConversations({
    status: status === 'all' ? undefined : status,
    search: search || undefined,
  });

  const formatDate = (value: string | Date) =>
    new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));

  return (
    <Shell>
      <PageIntro eyebrow="Admin" title={<>The inbox.</>}>Every conversation submitted to Tikvah, urgent ones first.</PageIntro>
      <section className="mx-auto max-w-[1100px] px-5 pb-24 sm:px-8">
        <AdminNav active="inbox" />

        <div className="mt-8 flex flex-col gap-4 border-y border-border py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {filters.map(f => (
              <button
                key={f.value}
                onClick={() => setStatus(f.value)}
                data-testid={`button-filter-${f.value}`}
                className={`rounded-full px-3.5 py-2 text-xs transition ${status === f.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground sm:w-72">
            <Search size={15} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              data-testid="input-admin-search"
              className="w-full bg-transparent outline-none placeholder:text-muted-foreground"
              placeholder="Search by name or email"
            />
          </label>
        </div>

        {isLoading ? (
          <p className="py-16 text-center text-sm text-muted-foreground">Loading…</p>
        ) : conversations.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">Nothing here right now.</p>
        ) : (
          <div className="mt-8 space-y-3">
            {conversations.map(conversation => (
              <Link
                key={conversation.id}
                href={`/admin/conversations/${conversation.id}`}
                data-testid={`link-admin-conversation-${conversation.id}`}
                className="block rounded-2xl border border-border bg-card p-5 transition hover:border-primary/50 hover:shadow-[var(--shadow-soft)] sm:p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="flex items-center gap-3">
                    <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${statusStyles[conversation.status]}`}>
                      {conversation.status.replace('_', ' ')}
                    </span>
                    <span className="text-sm font-medium">{conversation.user.name}</span>
                    <span className="text-xs text-muted-foreground">{conversation.user.email}</span>
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
