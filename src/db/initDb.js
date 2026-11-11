const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

const SEED_CUSTOMERS = [
	['CUS-001', 'Acme Retail', 'Priya Sharma', '+91 98765 43210', 'priya@acmeretail.in'],
	['CUS-002', 'Bright Office Co.', 'Rahul Verma', '+91 99887 76655', 'rahul@brightoffice.in'],
	['CUS-003', 'Metro Supplies', 'Vikram Mehta', '+91 98111 22334', 'vikram@metrosupplies.in'],
	['CUS-004', 'Nexus Trading', 'Anita Singh', '+91 91234 56789', 'anita@nexustrading.in'],
	['CUS-005', 'Greenline Stores', 'Karan Patel', '+91 97654 32109', 'karan@greenlinestores.in'],
	['CUS-006', 'Summit Tech Hub', 'Neha Nair', '+91 96543 21098', 'neha@summittech.in']
];

const SEED_PRODUCTS = [
	['PRD-001', 'Wireless mouse', 'PRD-001', 850, 'Peripherals', 142],
	['PRD-002', 'Mechanical keyboard', 'PRD-002', 1500, 'Peripherals', 64],
	['PRD-003', 'USB-C multiport hub', 'PRD-003', 2200, 'Accessories', 48],
	['PRD-004', 'Laptop stand aluminum', 'PRD-004', 1450, 'Workspace', 85],
	['PRD-005', '27" IPS Monitor', 'PRD-005', 14800, 'Displays', 19],
	['PRD-006', 'HD Webcam 1080p', 'PRD-006', 2650, 'Video', 37]
];

const SEED_ORDERS = [
	{
		orderNumber: 'SO-2026-0148',
		customerId: 'CUS-001',
		customerName: 'Acme Retail',
		orderDate: '11 Nov 2026',
		orderTime: '10:42 AM',
		amount: 7170,
		status: 'Confirmed',
		createdAt: '2026-11-11 10:42:00',
		items: [
			['1', 'PRD-001', 'Wireless mouse', 850, 4, 170, 3230],
			['2', 'PRD-002', 'Mechanical keyboard', 1500, 3, 560, 3940]
		]
	},
	{
		orderNumber: 'SO-2026-0147',
		customerId: 'CUS-002',
		customerName: 'Bright Office Co.',
		orderDate: '10 Nov 2026',
		orderTime: '04:15 PM',
		amount: 12450,
		status: 'Confirmed',
		createdAt: '2026-11-10 16:15:00',
		items: [
			['3', 'PRD-003', 'USB-C multiport hub', 2200, 4, 350, 8450],
			['4', 'PRD-004', 'Laptop stand aluminum', 1450, 3, 350, 4000]
		]
	},
	{
		orderNumber: 'SO-2026-0146',
		customerId: 'CUS-003',
		customerName: 'Metro Supplies',
		orderDate: '09 Nov 2026',
		orderTime: '11:30 AM',
		amount: 4800,
		status: 'Confirmed',
		createdAt: '2026-11-09 11:30:00',
		items: [
			['9', 'PRD-003', 'USB-C multiport hub', 2200, 2, 200, 4200],
			['10', 'PRD-001', 'Wireless mouse', 850, 1, 250, 600]
		]
	},
	{
		orderNumber: 'SO-2026-0145',
		customerId: 'CUS-004',
		customerName: 'Nexus Trading',
		orderDate: '09 Nov 2026',
		orderTime: '02:20 PM',
		amount: 8620,
		status: 'Pending',
		createdAt: '2026-11-09 14:20:00',
		items: [
			['5', 'PRD-006', 'HD Webcam 1080p', 2650, 2, 180, 5120],
			['6', 'PRD-002', 'Mechanical keyboard', 1500, 2, 0, 3000],
			['7', 'PRD-001', 'Wireless mouse', 850, 1, 350, 500]
		]
	},
	{
		orderNumber: 'SO-2026-0139',
		customerId: 'CUS-005',
		customerName: 'Greenline Stores',
		orderDate: '28 Oct 2026',
		orderTime: '11:05 AM',
		amount: 2850,
		status: 'Cancelled',
		createdAt: '2026-10-28 11:05:00',
		items: [
			['8', 'PRD-002', 'Mechanical keyboard', 1500, 2, 150, 2850]
		]
	},
	{
		orderNumber: 'SO-2026-0138',
		customerId: 'CUS-006',
		customerName: 'Summit Tech Hub',
		orderDate: '25 Oct 2026',
		orderTime: '03:50 PM',
		amount: 14000,
		status: 'Confirmed',
		createdAt: '2026-10-25 15:50:00',
		items: [
			['11', 'PRD-005', '27" IPS Monitor', 14800, 1, 800, 14000]
		]
	},
	{
		orderNumber: 'SO-2026-0137',
		customerId: 'CUS-001',
		customerName: 'Acme Retail',
		orderDate: '22 Oct 2026',
		orderTime: '09:15 AM',
		amount: 5600,
		status: 'Pending',
		createdAt: '2026-10-22 09:15:00',
		items: [
			['12', 'PRD-004', 'Laptop stand aluminum', 1450, 4, 200, 5600]
		]
	},
	{
		orderNumber: 'SO-2026-0136',
		customerId: 'CUS-002',
		customerName: 'Bright Office Co.',
		orderDate: '19 Oct 2026',
		orderTime: '05:10 PM',
		amount: 5000,
		status: 'Confirmed',
		createdAt: '2026-10-19 17:10:00',
		items: [
			['13', 'PRD-001', 'Wireless mouse', 850, 6, 100, 5000]
		]
	}
];

const SEED_NOTIFICATIONS = [
	['n1', 'Order SO-2026-0148 confirmed', 'Acme Retail · $7,170 ready for processing', '12m ago', false],
	['n2', 'Pending approval: SO-2026-0145', 'Nexus Trading order awaiting confirmation', '2h ago', false],
	['n3', 'Monthly target reached 87%', '5 completed orders this month', '1d ago', true]
];

async function runSchema(connection) {
	const schemaPath = path.join(__dirname, 'schema.sql');
	const sql = fs.readFileSync(schemaPath, 'utf8');
	const statements = sql
		.split(/;\s*(?:\r?\n|$)/)
		.map((s) => s.trim())
		.filter(Boolean);

	for (const statement of statements) {
		await connection.query(statement);
	}
}

async function seedInitialData(connection) {
	const [[{ customerCount }]] = await connection.query('SELECT COUNT(*) AS customerCount FROM customers');
	if (customerCount === 0) {
		await connection.query(
			'INSERT INTO customers (id, name, contact_name, phone, email) VALUES ?',
			[SEED_CUSTOMERS]
		);
	}

	const [[{ productCount }]] = await connection.query('SELECT COUNT(*) AS productCount FROM products');
	if (productCount === 0) {
		await connection.query(
			'INSERT INTO products (id, name, product_code, unit_price, category, stock) VALUES ?',
			[SEED_PRODUCTS]
		);
	}

	const [[{ orderCount }]] = await connection.query('SELECT COUNT(*) AS orderCount FROM orders');
	if (orderCount === 0) {
		for (const order of SEED_ORDERS) {
			await connection.query(
				`INSERT INTO orders
				 (order_number, customer_id, customer_name, order_date, order_time, amount, status, created_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
				[
					order.orderNumber,
					order.customerId,
					order.customerName,
					order.orderDate,
					order.orderTime,
					order.amount,
					order.status,
					order.createdAt
				]
			);

			const itemRows = order.items.map((item) => [
				item[0],
				order.orderNumber,
				item[1],
				item[2],
				item[3],
				item[4],
				item[5],
				item[6]
			]);
			await connection.query(
				`INSERT INTO order_items
				 (item_key, order_number, product_code, product_name, unit_price, quantity, discount, subtotal)
				 VALUES ?`,
				[itemRows]
			);
		}
	}

	const [[{ notificationCount }]] = await connection.query(
		'SELECT COUNT(*) AS notificationCount FROM notifications'
	);
	if (notificationCount === 0) {
		await connection.query(
			'INSERT INTO notifications (id, title, subtitle, time_ago, is_read) VALUES ?',
			[SEED_NOTIFICATIONS]
		);
	}

	await connection.query(
		`INSERT IGNORE INTO user_profiles (id, name, role, email, phone, workspace_name, currency)
		 VALUES (1, 'Alex Morgan', 'Regional Sales Lead', 'alex@orderly.in', '+91 98200 11223', 'Orderly Workspace', 'USD ($)')`
	);
}

async function initializeDatabase() {
	const connection = await pool.getConnection();
	try {
		await runSchema(connection);
		await connection.beginTransaction();
		await seedInitialData(connection);
		await connection.commit();
		console.log('Database schema and seed data ready.');
	} catch (error) {
		await connection.rollback();
		throw error;
	} finally {
		connection.release();
	}
}

if (require.main === module) {
	initializeDatabase()
		.then(() => pool.end())
		.catch((error) => {
			console.error('Database initialization failed:', error.message);
			process.exit(1);
		});
}

module.exports = { initializeDatabase };

