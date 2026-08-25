import assert from 'node:assert/strict';
import test from 'node:test';
import { hasProfessionalContact, parseCommaSeparated, professionalInitials } from './professionals';

test('comma-separated profile values are trimmed, deduplicated, and empty entries are removed', () => {
  assert.deepEqual(parseCommaSeparated(' Anxiety, grief, Anxiety, , trauma '), ['Anxiety', 'grief', 'trauma']);
});

test('a professional needs at least one usable contact method to publish', () => {
  assert.equal(hasProfessionalContact({ phone: '  ', email: null, website: '' }), false);
  assert.equal(
    hasProfessionalContact({
      phone: null,
      email: 'care@example.com',
      website: null,
    }),
    true,
  );
});

test('profile initials stay useful for missing images', () => {
  assert.equal(professionalInitials('Ada Nwosu'), 'AN');
  assert.equal(professionalInitials('  '), 'TH');
});
