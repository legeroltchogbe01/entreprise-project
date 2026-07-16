const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenvResult = require('dotenv').config({ path: path.join(__dirname, '../.env') });
console.log('[DOTENV DEBUG] Result:', dotenvResult);

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS manually to ensure headers are always present
app.use((req, res, next) => {
  const allowedOrigins = [
    'https://gmdpremiun.com',
    'https://www.gmdpremiun.com',
    'http://localhost:5173',
    'http://localhost:3000'
  ];
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global anti-cache middleware for API routes to prevent mobile/desktop browser caching
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// Routes configuration
const authRoutes = require('./routes/auth');
const walletRoutes = require('./routes/wallet');
const productRoutes = require('./routes/product');
const orderRoutes = require('./routes/order');
const specialRoutes = require('./routes/special');
const adminRoutes = require('./routes/admin');
const profileUpdateRoutes = require('./routes/profileUpdate');

app.use('/api/auth', authRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/special-requests', specialRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile-update-requests', profileUpdateRoutes);

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'GMD Créance API is running' });
});

// Version diagnostic route
app.get('/version', async (req, res) => {
  const prisma = require('./utils/prisma');
  let dbStatus = 'UNKNOWN';
  let dbError = null;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'CONNECTED';
  } catch (err) {
    dbStatus = 'FAILED';
    dbError = err.message;
  }
  res.json({ 
    version: '15-07-2026-v3', 
    dbStatus,
    dbError,
    routes: ['admin/companies', 'admin/orders', 'admin/reports', 'admin/product-fields'] 
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Une erreur interne est survenue sur le serveur.'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);

  // ── Daily payment reminder emails (J-3, J+1, J+7) ──────────────────────
  const { startReminderCron } = require('./utils/reminderCron');
  startReminderCron();
  // ─────────────────────────────────────────────────────────────────────────
});
