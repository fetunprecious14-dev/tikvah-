export type AdminAccessState = 'loading' | 'signed-out' | 'denied' | 'allowed';

export function getAdminAccessState(
  user: { role: string } | null,
  isLoading: boolean,
): AdminAccessState {
  if (isLoading) return 'loading';
  if (!user) return 'signed-out';
  return user.role === 'admin' ? 'allowed' : 'denied';
}

export type AdminQueryState = 'loading' | 'error' | 'empty' | 'success';

export function getAdminQueryState({
  isLoading,
  isError,
  hasData,
}: {
  isLoading: boolean;
  isError: boolean;
  hasData: boolean;
}): AdminQueryState {
  if (isLoading) return 'loading';
  if (isError) return 'error';
  return hasData ? 'success' : 'empty';
}

export function getAdminErrorMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== 'object') return fallback;

  const status = 'status' in error && typeof error.status === 'number' ? error.status : null;
  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 403) return 'This action is only available to the Tikvah team.';

  const data = 'data' in error ? error.data : null;
  if (
    status != null &&
    status >= 400 &&
    status < 500 &&
    data &&
    typeof data === 'object' &&
    'message' in data &&
    typeof data.message === 'string'
  ) {
    return data.message;
  }

  return fallback;
}
