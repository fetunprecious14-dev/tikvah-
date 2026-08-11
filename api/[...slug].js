// Vercel loads this entry point as CommonJS, while the bundled Express app is
// an ES module. Load it dynamically so Node does not try to require() app.mjs.
let appPromise;

module.exports = async function handler(req, res) {
  appPromise ??= import("../artifacts/api-server/dist/app.mjs").then(
    ({ default: app }) => app,
  );

  const app = await appPromise;
  return app(req, res);
};
