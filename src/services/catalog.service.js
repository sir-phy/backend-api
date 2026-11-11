const { pool } = require('../config/database');

async function getCustomers(query = '') {
	const q = String(query || '').trim();
	const [rows] = q
		? await pool.query(
				`SELECT id, name, contact_name, phone, email
				 FROM customers
				 WHERE name LIKE ? OR contact_name LIKE ? OR email LIKE ?
				 ORDER BY id ASC`,
				[`%${q}%`, `%${q}%`, `%${q}%`]
		  )
		: await pool.query('SELECT id, name, contact_name, phone, email FROM customers ORDER BY id ASC');

	return rows.map((r) => ({
		id: r.id,
		name: r.name,
		contactName: r.contact_name,
		phone: r.phone,
		email: r.email
	}));
}

async function getProducts(query = '') {
	const q = String(query || '').trim();
	const [rows] = q
		? await pool.query(
				`SELECT id, name, product_code, unit_price, category, stock
				 FROM products
				 WHERE name LIKE ? OR product_code LIKE ? OR category LIKE ?
				 ORDER BY id ASC`,
				[`%${q}%`, `%${q}%`, `%${q}%`]
		  )
		: await pool.query(
				'SELECT id, name, product_code, unit_price, category, stock FROM products ORDER BY id ASC'
		  );

	return rows.map((r) => ({
		id: r.id,
		name: r.name,
		productCode: r.product_code,
		unitPrice: Number(r.unit_price),
		category: r.category,
		stock: Number(r.stock)
	}));
}

async function getNotifications() {
	const [rows] = await pool.query(
		'SELECT id, title, subtitle, time_ago, is_read FROM notifications ORDER BY created_at DESC LIMIT 20'
	);
	return rows.map((r) => ({
		id: r.id,
		title: r.title,
		subtitle: r.subtitle,
		timeAgo: r.time_ago,
		isRead: Boolean(r.is_read)
	}));
}

async function getUserProfile() {
	const [rows] = await pool.query(
		'SELECT name, role, email, phone, workspace_name, currency FROM user_profiles WHERE id = 1 LIMIT 1'
	);
	if (rows.length === 0) {
		return {
			name: 'Alex Morgan',
			role: 'Regional Sales Lead',
			email: 'alex@orderly.in',
			phone: '+91 98200 11223',
			workspaceName: 'Orderly Workspace',
			currency: 'USD ($)'
		};
	}
	const r = rows[0];
	return {
		name: r.name,
		role: r.role,
		email: r.email,
		phone: r.phone,
		workspaceName: r.workspace_name,
		currency: r.currency
	};
}

module.exports = {
	getCustomers,
	getProducts,
	getNotifications,
	getUserProfile
};

