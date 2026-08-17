import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/shell';
import { getAdminErrorMessage } from '@/lib/admin-state';

export function AdminErrorState({
  error,
  onRetry,
  retrying = false,
  title = 'We could not load this part of the admin area.',
}: {
  error: unknown;
  onRetry: () => void;
  retrying?: boolean;
  title?: string;
}) {
  return (
    <div className="my-8 rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center" role="alert" data-testid="admin-error-state">
      <AlertCircle className="mx-auto text-destructive" size={24} />
      <p className="mt-3 font-semibold">{title}</p>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
        {getAdminErrorMessage(error, 'Something went wrong. Please try again.')}
      </p>
      <div className="mt-5 flex justify-center">
        <Button onClick={onRetry} disabled={retrying} secondary testId="button-admin-retry">
          <RefreshCw size={14} /> {retrying ? 'Trying again…' : 'Try again'}
        </Button>
      </div>
    </div>
  );
}

export function AdminMutationError({ error, fallback }: { error: unknown; fallback: string }) {
  if (!error) return null;

  return (
    <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert" data-testid="admin-mutation-error">
      {getAdminErrorMessage(error, fallback)}
    </p>
  );
}
