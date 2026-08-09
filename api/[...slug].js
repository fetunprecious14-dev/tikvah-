// One Vercel Function serves every /api/* route. The production build creates
// the bundled Express application before Vercel packages this entry point.
export { default } from "../artifacts/api-server/dist/app.mjs";
