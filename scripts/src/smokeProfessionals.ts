import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { inArray } from "drizzle-orm";
import {
  db,
  pool,
  professionalsTable,
  sessionsTable,
  usersTable,
} from "@workspace/db";

const baseUrl = process.env.SMOKE_BASE_URL ?? "http://localhost:5173";
const tokenHash = (token: string) =>
  createHash("sha256").update(token).digest("hex");
const createdSessionHashes: string[] = [];
const createdProfessionalIds: string[] = [];

async function createSmokeSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const hash = tokenHash(token);
  await db.insert(sessionsTable).values({
    userId,
    tokenHash: hash,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });
  createdSessionHashes.push(hash);
  return token;
}

async function request(path: string, token?: string, init?: RequestInit) {
  return fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      ...(token ? { cookie: `tikvah_session=${token}` } : {}),
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...init?.headers,
    },
  });
}

try {
  const users = await db
    .select({ id: usersTable.id, role: usersTable.role })
    .from(usersTable);
  const admin = users.find((user) => user.role === "admin");
  const regularUser = users.find((user) => user.role === "user");
  assert.ok(
    admin,
    "An admin account is required for the professional-directory smoke test.",
  );
  assert.ok(
    regularUser,
    "A regular account is required for the professional-directory smoke test.",
  );

  const adminToken = await createSmokeSession(admin.id);
  const userToken = await createSmokeSession(regularUser.id);
  assert.equal(
    (await request("/api/admin/professionals")).status,
    401,
    "Signed-out requests should be rejected.",
  );
  assert.equal(
    (await request("/api/admin/professionals", userToken)).status,
    403,
    "Regular users should be rejected.",
  );
  assert.equal(
    (await request("/api/admin/professionals", adminToken)).status,
    200,
    "Administrators should be allowed.",
  );

  const uniqueName = `Smoke Professional ${Date.now()}`;
  const createResponse = await request("/api/admin/professionals", adminToken, {
    method: "POST",
    body: JSON.stringify({
      name: uniqueName,
      profession: "Test counsellor",
      bio: "Temporary profile created by the automated professional-directory smoke check.",
      specialties: ["Testing"],
      languages: ["English"],
      offersRemote: true,
      offersInPerson: false,
      isPublished: false,
      displayOrder: 9999,
    }),
  });
  assert.equal(
    createResponse.status,
    201,
    "An administrator should be able to create a draft.",
  );
  const created = (await createResponse.json()) as { id: string };
  createdProfessionalIds.push(created.id);

  const hiddenResponse = await request(
    `/api/professionals?search=${encodeURIComponent(uniqueName)}`,
  );
  assert.deepEqual(
    await hiddenResponse.json(),
    [],
    "Drafts should stay hidden from the public endpoint.",
  );

  const invalidPublish = await request(
    `/api/admin/professionals/${created.id}`,
    adminToken,
    {
      method: "PATCH",
      body: JSON.stringify({ isPublished: true }),
    },
  );
  assert.equal(
    invalidPublish.status,
    400,
    "Publishing without contact details should be rejected.",
  );

  const publishResponse = await request(
    `/api/admin/professionals/${created.id}`,
    adminToken,
    {
      method: "PATCH",
      body: JSON.stringify({
        email: "smoke-professional@example.com",
        isPublished: true,
      }),
    },
  );
  assert.equal(
    publishResponse.status,
    200,
    "A complete professional should be publishable.",
  );

  const publicResponse = await request(
    `/api/professionals?search=${encodeURIComponent(uniqueName)}`,
  );
  const publicProfessionals = (await publicResponse.json()) as Array<{
    id: string;
  }>;
  assert.equal(
    publicProfessionals[0]?.id,
    created.id,
    "Published profiles should appear publicly.",
  );

  const deleteResponse = await request(
    `/api/admin/professionals/${created.id}`,
    adminToken,
    { method: "DELETE" },
  );
  assert.equal(
    deleteResponse.status,
    204,
    "Administrators should be able to delete a profile.",
  );
  createdProfessionalIds.length = 0;

  console.log(
    "Professional-directory smoke test passed for authorization, draft visibility, publishing, and deletion.",
  );
} finally {
  if (createdProfessionalIds.length > 0) {
    await db
      .delete(professionalsTable)
      .where(inArray(professionalsTable.id, createdProfessionalIds));
  }
  if (createdSessionHashes.length > 0) {
    await db
      .delete(sessionsTable)
      .where(inArray(sessionsTable.tokenHash, createdSessionHashes));
  }
  await pool.end();
}
