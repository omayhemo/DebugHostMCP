#!/usr/bin/env node

// Standalone backend server - NO DEPENDENCIES on other modules
const http = require('http');
const url = require('url');

const PORT = 2601;
const HOST = '127.0.0.1';

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  console.log(`[${new Date().toISOString()}] ${req.method} ${path}`);
  
  switch (path) {
    case '/health':
      res.writeHead(200);
      res.end(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0'
      }));
      break;
      
    case '/api/servers':
      res.writeHead(200);
      res.end(JSON.stringify([]));
      break;
      
    case '/api/logs':
      res.writeHead(200);
      res.end(JSON.stringify({ logs: [] }));
      break;
      
    case '/api/metrics/containers':
      res.writeHead(200);
      res.end(JSON.stringify([]));
      break;
      
    case '/api/projects':
      res.writeHead(200);
      res.end(JSON.stringify([]));
      break;
      
    default:
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Standalone backend running at http://${HOST}:${PORT}`);
  console.log('Health check: http://localhost:2601/health');
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});