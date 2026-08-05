import app from "./app";
import { logger } from "./lib/logger";
import { pool } from "@workspace/db";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const server = app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});

// Only relevant for a traditional long-running deployment (this file isn't
// used at all on Vercel, which imports the app directly — see
// api/[...slug].js). Stop accepting new connections, let in-flight requests
// finish, then close the DB pool cleanly instead of dropping connections mid-query.
function shutdown(signal: string) {
  logger.info({ signal }, "Shutting down");
  server.close(() => {
    pool
      .end()
      .then(() => process.exit(0))
      .catch((err) => {
        logger.error({ err }, "Error closing the database pool");
        process.exit(1);
      });
  });
  // Don't hang forever if something (a slow request, a stuck connection)
  // never lets the graceful path finish.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
