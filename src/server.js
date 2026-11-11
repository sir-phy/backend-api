// Import packages
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { checkDatabaseConnection } = require('./config/database');
const { initializeDatabase } = require('./db/initDb');
const { errorMiddleware } = require('./middleware/error.middleware');
const healthRoutes = require('./routes/health.routes');
const orderRoutes = require('./routes/order.routes');
const customerRoutes = require('./routes/customer.routes');
const productRoutes = require('./routes/product.routes');
const { dashboardOverview } = require('./controllers/order.controller');
const { listNotifications, getProfile } = require('./controllers/catalog.controller');

// Initialize Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/dashboard/overview', dashboardOverview);
app.use('/orders', orderRoutes);
app.use('/customers', customerRoutes);
app.use('/products', productRoutes);
app.get('/notifications', listNotifications);
app.get('/profile', getProfile);
app.use('/api/health', healthRoutes);

// API welcome route
app.get('/', (req, res) => {
	res.json({
		success: true,
		message: 'Sales Order API is running!'
	});
});

// Health check route
app.get('/api/health', (req, res) => {
	res.status(200).json({
		success: true,
		message: 'API is healthy',
		timestamp: new Date().toISOString()
	});
});

app.use(errorMiddleware);

// Start server and ensure database schema + seed data exist.
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});

checkDatabaseConnection()
	.then(() => initializeDatabase())
	.catch((error) => {
		console.error('MySQL database initialization failed:', error.message);
	});
