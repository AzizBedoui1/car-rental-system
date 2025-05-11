const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const router = express.Router();

// Log incoming requests
router.use((req, res, next) => {
  console.log(`[Router] Incoming: ${req.method} ${req.originalUrl}`);
  next();
});

// Proxy for /users
router.all('/users', (req, res, next) => {
  console.log(`[Router] Matched /users: ${req.method}`);
  if (req.method === 'POST') {
    console.log(`[Router] POST /users body:`, req.body);
  }
  next();
}, createProxyMiddleware({
  target: 'http://localhost:5002',
  changeOrigin: true,
  timeout: 30000,
  proxyTimeout: 30000,
  onError: (err, req, res) => {
    console.error(`[Proxy /users] Error: ${err.message}`);
    res.status(500).json({ error: 'Failed to connect to user service', details: err.message });
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[Proxy /users] Proxying ${req.method} ${req.originalUrl} to http://localhost:5002${req.url}`);
    if (req.body && Object.keys(req.body).length > 0) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
      console.log(`[Proxy /users] Sent body:`, bodyData);
    } else {
      console.log(`[Proxy /users] No body provided`);
      proxyReq.setHeader('Content-Length', 0);
    }
  },
  onProxyRes: (proxyRes, req) => {
    console.log(`[Proxy /users] Response: ${req.method} ${req.originalUrl} -> ${proxyRes.statusCode}`);
  },
}));

// Proxy for /cars
router.all('/cars', (req, res, next) => {
  console.log(`[Router] Matched /cars: ${req.method}`);
  if (req.method === 'POST') {
    console.log(`[Router] POST /cars body:`, req.body);
  }
  next();
}, createProxyMiddleware({
  target: 'http://localhost:5005',
  changeOrigin: true,
  timeout: 30000,
  proxyTimeout: 30000,
  onError: (err, req, res) => {
    console.error(`[Proxy /cars] Error: ${err.message}`);
    res.status(500).json({ error: 'Failed to connect to car service', details: err.message });
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[Proxy /cars] Proxying ${req.method} ${req.originalUrl} to http://localhost:5005${req.url}`);
    if (req.body && Object.keys(req.body).length > 0) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
      console.log(`[Proxy /cars] Sent body:`, bodyData);
    } else {
      console.log(`[Proxy /cars] No body provided`);
      proxyReq.setHeader('Content-Length', 0);
    }
  },
  onProxyRes: (proxyRes, req) => {
    console.log(`[Proxy /cars] Response: ${req.method} ${req.originalUrl} -> ${proxyRes.statusCode}`);
  },
}));

// Proxy for /reservations
router.all('/reservations', (req, res, next) => {
  console.log(`[Router] Matched /reservations: ${req.method}`);
  if (req.method === 'POST') {
    console.log(`[Router] POST /reservations body:`, req.body);
  }
  next();
}, createProxyMiddleware({
  target: 'http://localhost:5003',
  changeOrigin: true,
  timeout: 30000,
  proxyTimeout: 30000,
  onError: (err, req, res) => {
    console.error(`[Proxy /reservations] Error: ${err.message}`);
    res.status(500).json({ error: 'Failed to connect to reservation service', details: err.message });
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[Proxy /reservations] Proxying ${req.method} ${req.originalUrl} to http://localhost:5003${req.url}`);
    if (req.body && Object.keys(req.body).length > 0) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
      console.log(`[Proxy /reservations] Sent body:`, bodyData);
    } else {
      console.log(`[Proxy /reservations] No body provided`);
      proxyReq.setHeader('Content-Length', 0);
    }
  },
  onProxyRes: (proxyRes, req) => {
    console.log(`[Proxy /reservations] Response: ${req.method} ${req.originalUrl} -> ${proxyRes.statusCode}`);
  },
}));

// Catch-all for unmatched routes
router.use((req, res) => {
  console.log(`[Router] Unmatched: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: `Cannot ${req.method} ${req.originalUrl}` });
});

module.exports = router;