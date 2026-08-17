import assert from 'node:assert/strict';
import test from 'node:test';
import { getAdminAccessState, getAdminErrorMessage, getAdminQueryState } from './admin-state';

test('admin access distinguishes loading, signed-out, denied, and allowed states', () => {
  assert.equal(getAdminAccessState(null, true), 'loading');
  assert.equal(getAdminAccessState(null, false), 'signed-out');
  assert.equal(getAdminAccessState({ role: 'user' }, false), 'denied');
  assert.equal(getAdminAccessState({ role: 'admin' }, false), 'allowed');
});

test('admin query state does not disguise failures as empty data', () => {
  assert.equal(getAdminQueryState({ isLoading: true, isError: false, hasData: false }), 'loading');
  assert.equal(getAdminQueryState({ isLoading: false, isError: true, hasData: false }), 'error');
  assert.equal(getAdminQueryState({ isLoading: false, isError: false, hasData: false }), 'empty');
  assert.equal(getAdminQueryState({ isLoading: false, isError: false, hasData: true }), 'success');
});

test('admin errors give safe, useful messages', () => {
  assert.equal(getAdminErrorMessage({ status: 401 }, 'Fallback'), 'Your session has expired. Please sign in again.');
  assert.equal(getAdminErrorMessage({ status: 403 }, 'Fallback'), 'This action is only available to the Tikvah team.');
  assert.equal(getAdminErrorMessage({ status: 400, data: { message: 'Please enter a title.' } }, 'Fallback'), 'Please enter a title.');
  assert.equal(getAdminErrorMessage({ status: 500, data: { message: 'Database details' } }, 'Safe fallback'), 'Safe fallback');
});
