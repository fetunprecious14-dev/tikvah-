import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import { inArray } from 'drizzle-orm';
import { db, pool, sessionsTable, usersTable } from '@workspace/db';

const baseUrl = process.env.SMOKE_BASE_URL ?? 'http://localhost:5173';
const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');
const createdHashes: string[] = [];

async function createSmokeSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString('base64url');
  const hash = tokenHash(token);
  await db.insert(sessionsTable).values({
    userId,
    tokenHash: hash,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });
  createdHashes.push(hash);
  return token;
}

async function request(path: string, token?: string): Promise<number> {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: token ? { cookie: `tikvah_session=${token}` } : undefined,
  });
  return response.status;
}

try {
  const users = await db.select({ id: usersTable.id, role: usersTable.role }).from(usersTable);
  const admin = users.find(user => user.role === 'admin');
  const regularUser = users.find(user => user.role === 'user');

  assert.ok(admin, 'An admin account is required for the admin smoke test.');
  assert.ok(regularUser, 'A regular account is required for the admin smoke test.');

  const adminToken = await createSmokeSession(admin.id);
  const userToken = await createSmokeSession(regularUser.id);
  const paths = ['/api/admin/conversations', '/api/admin/resources', '/api/admin/analytics'];

  for (const path of paths) {
    assert.equal(await request(path), 401, `${path} should reject signed-out requests.`);
    assert.equal(await request(path, userToken), 403, `${path} should reject regular users.`);
    assert.equal(await request(path, adminToken), 200, `${path} should allow administrators.`);
  }

  console.log('Admin API smoke test passed for signed-out, regular-user, and admin sessions.');
} finally {
  if (createdHashes.length > 0) {
    await db.delete(sessionsTable).where(inArray(sessionsTable.tokenHash, createdHashes));
  }
  await pool.end();
}
