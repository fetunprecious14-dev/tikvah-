import { useAdminGetAnalytics } from '@workspace/api-client-react';
import { Shell, PageIntro } from '@/components/shell';
import { AdminNav } from './admin-nav';
import { AdminErrorState } from './admin-feedback';

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6" data-testid={`stat-${label.toLowerCase().replaceAll(' ', '-')}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-muted-foreground">{label}</p>
      <p className="mt-3 font-serif text-4xl">{value}</p>
    </div>
  );
}

export function AdminAnalytics() {
  const { data, isLoading, isError, error, refetch, isFetching } = useAdminGetAnalytics();

  return (
    <Shell>
      <PageIntro eyebrow="Admin" title={<>How Tikvah is doing.</>}>Not likes or shares — lives supported, and how quickly.</PageIntro>
      <section className="mx-auto max-w-[1100px] px-5 pb-24 sm:px-8">
        <AdminNav active="analytics" />

        {isLoading ? (
          <p className="py-16 text-center text-sm text-muted-foreground">Loading…</p>
        ) : isError ? (
          <AdminErrorState error={error} onRetry={() => { void refetch(); }} retrying={isFetching} title="We could not load the admin analytics." />
        ) : !data ? (
          <p className="py-16 text-center text-sm text-muted-foreground">No analytics are available yet.</p>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatTile label="Total users" value={data.totalUsers} />
            <StatTile label="Active users (30d)" value={data.activeUsers30d} />
            <StatTile label="New registrations (7d)" value={data.newRegistrations7d} />
            <StatTile label="Total conversations" value={data.totalConversations} />
            <StatTile label="Awaiting reply" value={data.awaitingReplyCount} />
            <StatTile label="Urgent" value={data.urgentCount} />
            <StatTile label="Responded" value={data.respondedCount} />
            <StatTile label="Archived" value={data.archivedCount} />
            <StatTile label="Avg. response time" value={data.avgResponseTimeMinutes != null ? `${data.avgResponseTimeMinutes} min` : '—'} />
            <StatTile label="Resource views (30d)" value={data.resourceViews30d} />
          </div>
        )}
      </section>
    </Shell>
  );
}
