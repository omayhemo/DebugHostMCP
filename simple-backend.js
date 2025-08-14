#!/usr/bin/env node

// Simple backend that actually works
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 2601;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// Dashboard expects these endpoints
app.get('/api/servers', (req, res) => {
  res.json([]);
});

app.get('/api/projects', (req, res) => {
  res.json([]);
});

app.get('/api/logs', (req, res) => {
  res.json({ logs: [] });
});

app.get('/api/metrics/containers', (req, res) => {
  res.json([]);
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Simple backend running on http://localhost:${PORT}`);
});