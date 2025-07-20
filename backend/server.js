const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { connectDB } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware с отладкой
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.get('Origin')}`);
  next();
});

app.use(cors({
  origin: [
    'https://be078951-f877-4538-9775-d0a2307d5c57.lovableproject.com',
    'http://localhost:5173',
    'http://localhost:3000',
    /^https:\/\/.*\.lovableproject\.com$/,
    /^https:\/\/.*\.vercel\.app$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Статические файлы для uploads
const uploadPath = process.env.UPLOAD_PATH || 'uploads';
app.use('/uploads', express.static(path.join(__dirname, uploadPath)));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/accommodations', require('./routes/accommodations'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/accounting', require('./routes/accounting').router);
app.use('/api/audit', require('./routes/audit'));

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Vivood Backend API is running', timestamp: new Date().toISOString() });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Запуск сервера
const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API available at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();