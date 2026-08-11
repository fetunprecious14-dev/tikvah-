/**
 * Supabase appends `error`/`error_description` to a redirect URL when an
 * email link (confirmation, recovery) is invalid or expired — as a query
 * param for the PKCE flow, or in the URL hash for the older implicit flow.
 * Used by both verify-email.tsx and reset-password.tsx, which are both
 * landing pages for one of these links.
 */
export function readAuthRedirectError(): string | null {
  const fromQuery = new URLSearchParams(window.location.search).get('error_description');
  if (fromQuery) return fromQuery;
  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
  return new URLSearchParams(hash).get('error_description');
}
