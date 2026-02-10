require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Initialize database (creates tables + seeds admin)
require('./db/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/accounts', require('./routes/accounts'));
app.use('/api/assistances', require('./routes/assistances'));
app.use('/api/family-members', require('./routes/familyMembers'));
app.use('/api/pharmacies', require('./routes/pharmacies'));
app.use('/api/source-of-funds', require('./routes/sourceOfFunds'));
app.use('/api/users', require('./routes/users'));

// Serve static files from dist/ in production
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Global error handler — catches unhandled errors in route handlers
// and returns a proper JSON 500 response instead of crashing
app.use((err, req, res, _next) => {
  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

app.listen(PORT, () => {
  console.log(`MPIS server running on http://localhost:${PORT}`);
});
