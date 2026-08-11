import express, { type Express } from "express";
import cors from "cors";
// Named import, not default: pino-http is CJS, and its `export default` becomes
// `exports.default`. Under NodeNext module resolution (which Vercel's Node
// builder uses) a default import of a CJS module yields the whole module object,
// which isn't callable — TS2349. The named export works under every module
// resolution mode and at runtime in both CJS and ESM.
import { pinoHttp } from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

/** The subset of the request/response we actually log — see the note on `serializers` below. */
type LoggedRequest = { id?: unknown; method?: string; url?: string };
type LoggedResponse = { statusCode?: number };

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    // These params are typed explicitly rather than left to inference. Under
    // some module-resolution modes (e.g. classic `node`, which can't read
    // pino's `exports` map) pino-http's option types degrade to `any`, the
    // params lose their contextual type, and `noImplicitAny` fails the build
    // with TS7006. Declaring the minimal shape we actually read keeps this
    // compiling no matter how the toolchain resolves pino's types.
    serializers: {
      req(req: LoggedRequest) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res: LoggedResponse) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(
  cors({
    // Auth is a bearer token in the Authorization header (Supabase Auth's
    // access token — see lib/supabaseAuth.ts), not a cookie, so this doesn't
    // need `credentials: true` and can simply reflect the request origin.
    // Reflecting keeps this working across the dev server's arbitrary port
    // and behind Replit's preview domains, while an explicit CORS_ORIGIN can
    // pin it down for a real deployment.
    origin: process.env.CORS_ORIGIN ?? true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
