import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AdminErrorState, AdminMutationError } from './admin-feedback';

test('admin query failures render a retry action', () => {
  const html = renderToStaticMarkup(
    <AdminErrorState error={{ status: 500 }} onRetry={() => undefined} title="Inbox unavailable" />,
  );

  assert.match(html, /role="alert"/);
  assert.match(html, /Inbox unavailable/);
  assert.match(html, /Try again/);
});

test('admin mutation failures render a safe message', () => {
  const html = renderToStaticMarkup(
    <AdminMutationError error={{ status: 500, data: { message: 'private server detail' } }} fallback="Your draft is still here." />,
  );

  assert.match(html, /Your draft is still here\./);
  assert.doesNotMatch(html, /private server detail/);
});
