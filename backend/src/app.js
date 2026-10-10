

const express = require('express');
const cors = require('cors');
require('dotenv').config();


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

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173', // Vite default (React)
  'http://localhost:3001',
];

app.use(cors({
  origin: (origin, callback) => {
    // Ruhusu requests bila origin (mfano: Postman, Thunder Client)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Kwa development, ruhusu origins zote za localhost
    if (process.env.NODE_ENV === 'development' && origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    
    callback(new Error('CORS: Origin haijaruhusiwa'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

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

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Wifi Voucher Backend',
    docs: '/api/health',
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    code: 'ROUTE_NOT_FOUND',
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
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