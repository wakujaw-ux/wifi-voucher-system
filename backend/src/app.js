const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('./config/env'); // Environment validation

const logger = require('./middleware/logger.middleware');
const { globalLimiter } = require('./middleware/rateLimit.middleware');

const expenseRoutes = require('./routes/expense.routes');
const userRoutes = require('./routes/user.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const sessionRoutes = require('./routes/session.routes');
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const packageRoutes = require('./routes/package.routes');
const voucherRoutes = require('./routes/voucher.routes');
const saleRoutes = require('./routes/sale.routes');
const reportRoutes = require('./routes/report.routes');

const app = express();

// Security
app.use(helmet());

// CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:3001',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (process.env.NODE_ENV === 'development' && origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    callback(new Error('CORS: Origin haijaruhusiwa'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parser
app.use(express.json({ limit: '1mb' }));

// Logger
app.use(logger);

// Global rate limiter
app.use(globalLimiter);

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/vouchers', voucherRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/reports', reportRoutes);

// Root
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Wifi Voucher Backend',
    docs: '/api/health',
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    code: 'ROUTE_NOT_FOUND',
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  
  // Kama ni CORS error
  if (err.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      message: err.message,
      code: 'CORS_ERROR',
    });
  }
  
  // Kama ni kosa la JSON parser
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'JSON si sahihi',
      code: 'INVALID_JSON',
    });
  }
  
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
    code: err.code || 'INTERNAL_ERROR',
  });
});

const PORT = parseInt(process.env.PORT, 10) || 3000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`📚 Try: http://localhost:${PORT}/api/health`);
});

server.on('error', (err) => {
  console.error('SERVER ERROR:', err);
});

// Graceful shutdown
const shutdown = (signal) => {
  console.log(`\n⚠️  Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
  
  // Force shutdown baada ya sekunde 10
  setTimeout(() => {
    console.error('❌ Forced shutdown after 10s');
    process.exit(1);
  }, 10000);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));