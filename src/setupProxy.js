const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  app.use('/api/auth/', createProxyMiddleware({
    target: 'http://localhost:8101',
    changeOrigin: true,
    pathRewrite: { '^/api/auth': '' },
  }));

  app.use('/api/manage/', createProxyMiddleware({
    target: 'http://localhost:8102',
    changeOrigin: true,
    pathRewrite: { '^/api/manage': '' },
    // proxyTimeout: proxy→backend socket kept alive by SSE heartbeats (every 15 s).
    // No `timeout` here — that option calls req.socket.setTimeout() inside the
    // middleware, overriding the on('proxyReq') reset below and killing SSE
    // connections after the specified interval.
    proxyTimeout: 600000,
    on: {
      proxyReq: (_proxyReq, req, res) => {
        // Disable the incoming socket timeout so long-running SSE and AI
        // annotation streams are never forcibly closed by the proxy.
        req.socket.setTimeout(0);
        res.setTimeout(0);
      },
    },
  }));

  app.use('/api/stats/', createProxyMiddleware({
    target: 'http://localhost:8103',
    changeOrigin: true,
    pathRewrite: { '^/api/stats': '' },
  }));
};
