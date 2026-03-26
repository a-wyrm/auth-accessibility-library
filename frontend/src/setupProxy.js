const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function setupProxy(app) {
  const target = process.env.BACKEND_PROXY || 'http://localhost:8080';
  // CRA mounts this middleware at /api and strips that prefix from req.url.
  // Add /api back so backend routes still match /api/auth/*.
  console.log(`[setupProxy] proxying /api to ${target} (preserving /api prefix)`);

  app.use(
    '/api',
    createProxyMiddleware({
      target,
      changeOrigin: true,
      logLevel: 'warn',
      pathRewrite: (path) => `/api${path}`,
    }),
  );
};
