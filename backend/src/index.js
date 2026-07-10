const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.get('/version', (req, res) => {
  res.json({ version: 'f8bc624', routes: ['admin/companies', 'admin/product-fields', 'admin/product-fields/:id'] });
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
