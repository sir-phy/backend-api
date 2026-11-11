const { pool } = require('../config/database');
const { AppError } = require('../middleware/error.middleware');

const VALID_STATUSES = new Set(['Pending', 'Confirmed', 'Cancelled']);
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatOrderDateTime(date) {
	const day = String(date.getDate()).padStart(2, '0');
	const month = MONTHS[date.getMonth()];
	const year = date.getFullYear();
	let hours = date.getHours();
	const minutes = String(date.getMinutes()).padStart(2, '0');
	const ampm = hours >= 12 ? 'PM' : 'AM';
	hours = hours % 12 || 12;
	return {
		orderDate: `${day} ${month} ${year}`,
		orderTime: `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`
	};
}

function mapCustomerRow(row) {
	if (!row || !row.customer_id) return null;
	return {
		id: row.customer_id,
		name: row.c_name || row.customer_name,
		contactName: row.c_contact_name || '',
		phone: row.c_phone || '',
		email: row.c_email || ''
	};
}

function mapOrderItemRow(row) {
	return {
		id: String(row.item_key || row.id),
		name: row.product_name,
		productCode: row.product_code,
		unitPrice: Number(row.unit_price),
		quantity: Number(row.quantity),
		discount: Number(row.discount)
	};
}

function mapOrderRow(row, items = []) {
	return {
		orderNumber: row.order_number,
		customerName: row.customer_name,
		customer: mapCustomerRow(row),
		date: row.order_date,
		time: row.order_time,
		createdAt: new Date(row.created_at).toISOString(),
		items,
		amount: Number(row.amount),
		status: row.status
	};
}

async function attachItemsToOrders(orderRows) {
	if (orderRows.length === 0) return [];
	const orderNumbers = orderRows.map((o) => o.order_number);
	const [itemRows] = await pool.query(
		'SELECT * FROM order_items WHERE order_number IN (?) ORDER BY id ASC',
		[orderNumbers]
	);
	const itemsByOrder = new Map();
	for (const row of itemRows) {
		if (!itemsByOrder.has(row.order_number)) {
			itemsByOrder.set(row.order_number, []);
		}
		itemsByOrder.get(row.order_number).push(mapOrderItemRow(row));
	}
	return orderRows.map((row) => mapOrderRow(row, itemsByOrder.get(row.order_number) || []));
}

const ORDER_SELECT_SQL = `
	SELECT
		o.*,
		c.name AS c_name,
		c.contact_name AS c_contact_name,
		c.phone AS c_phone,
		c.email AS c_email
	FROM orders o
	LEFT JOIN customers c ON c.id = o.customer_id
`;

async function getDashboardOverview(period = 'This month') {
	let whereClause = '';
	let growthText = '+18% vs Oct';

	if (period === 'This month') {
		whereClause = 'WHERE YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())';
		growthText = '+18% vs Oct';
	} else if (period === 'Last month') {
		whereClause =
			'WHERE YEAR(created_at) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) ' +
			'AND MONTH(created_at) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))';
		growthText = '+12% vs Sep';
	} else {
		growthText = '+24% YoY';
	}

	const [rows] = await pool.query(
		`SELECT
			COUNT(*) AS totalOrders,
			COALESCE(SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END), 0) AS pendingOrders,
			COALESCE(SUM(CASE WHEN status = 'Confirmed' THEN 1 ELSE 0 END), 0) AS completedOrders
		 FROM orders ${whereClause}`
	);

	const totalOrders = Number(rows[0].totalOrders || 0);
	const pendingOrders = Number(rows[0].pendingOrders || 0);
	const completedOrders = Number(rows[0].completedOrders || 0);
	const rate = totalOrders === 0 ? 0 : Math.round((completedOrders / totalOrders) * 100);

	return {
		totalOrders,
		pendingOrders,
		completedOrders,
		growthText,
		completionRateText: `${rate}% of orders`,
		period,
		updatedLabel: 'Updated just now'
	};
}

async function getRecentOrders(limit = 3) {
	const safeLimit = Math.max(1, Math.min(20, Number(limit) || 3));
	const [orderRows] = await pool.query(
		`${ORDER_SELECT_SQL} ORDER BY o.created_at DESC, o.id DESC LIMIT ?`,
		[safeLimit]
	);
	return attachItemsToOrders(orderRows);
}

async function getOrders({ status = 'All', query = '', sort = 'desc', page = 1, pageSize = 4 }) {
	const conditions = [];
	const params = [];

	if (status && status !== 'All') {
		conditions.push('o.status = ?');
		params.push(status);
	}

	const q = String(query || '').trim();
	if (q) {
		conditions.push('(o.order_number LIKE ? OR o.customer_name LIKE ?)');
		params.push(`%${q}%`, `%${q}%`);
	}

	const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
	const direction = String(sort).toLowerCase() === 'asc' ? 'ASC' : 'DESC';

	const [[{ totalCount }]] = await pool.query(
		`SELECT COUNT(*) AS totalCount FROM orders o ${whereClause}`,
		params
	);
	const [[{ totalDatasetCount }]] = await pool.query(
		'SELECT COUNT(*) AS totalDatasetCount FROM orders'
	);

	const safePage = Math.max(1, Number(page) || 1);
	const safePageSize = Math.max(1, Math.min(50, Number(pageSize) || 4));
	const cumulativeLimit = safePage * safePageSize;

	const [orderRows] = await pool.query(
		`${ORDER_SELECT_SQL} ${whereClause} ORDER BY o.created_at ${direction}, o.id ${direction} LIMIT ?`,
		[...params, cumulativeLimit]
	);

	const orders = await attachItemsToOrders(orderRows);
	const total = Number(totalCount || 0);

	return {
		orders,
		totalCount: total,
		totalDatasetCount: Number(totalDatasetCount || 0),
		page: safePage,
		pageSize: safePageSize,
		hasMore: cumulativeLimit < total
	};
}

async function getOrderByNumber(orderNumber) {
	const [orderRows] = await pool.query(
		`${ORDER_SELECT_SQL} WHERE o.order_number = ? LIMIT 1`,
		[orderNumber]
	);
	if (orderRows.length === 0) {
		throw new AppError(`Order ${orderNumber} not found`, 404);
	}
	const [order] = await attachItemsToOrders(orderRows);
	return order;
}

async function computeNextOrderNumber(executor = pool) {
	const [rows] = await executor.query(
		`SELECT order_number FROM orders
		 WHERE order_number LIKE 'SO-2026-%'
		 ORDER BY CAST(SUBSTRING_INDEX(order_number, '-', -1) AS UNSIGNED) DESC
		 LIMIT 1`
	);
	let nextSeq = 149;
	if (rows.length > 0) {
		const suffix = Number(rows[0].order_number.split('-').pop());
		if (!Number.isNaN(suffix)) {
			nextSeq = suffix + 1;
		}
	}
	return `SO-2026-${String(nextSeq).padStart(4, '0')}`;
}

async function saveOrderDraft({ orderNumber, customer, items = [] }) {
	if (!orderNumber) {
		throw new AppError('orderNumber is required', 400);
	}
	const customerId = customer && customer.id ? customer.id : null;
	await pool.query(
		`INSERT INTO order_drafts (order_number, customer_id, customer_json, items_json, saved_at)
		 VALUES (?, ?, ?, ?, NOW())
		 ON DUPLICATE KEY UPDATE
			customer_id = VALUES(customer_id),
			customer_json = VALUES(customer_json),
			items_json = VALUES(items_json),
			saved_at = NOW()`,
		[
			orderNumber,
			customerId,
			customer ? JSON.stringify(customer) : null,
			JSON.stringify(items || [])
		]
	);

	return {
		orderNumber,
		customer: customer || null,
		items: items || [],
		savedAt: new Date().toISOString()
	};
}

async function createOrder({ orderNumber, customerId, customer, items, status = 'Confirmed' }) {
	if (!Array.isArray(items) || items.length === 0) {
		throw new AppError('At least one product is required', 400);
	}
	if (!VALID_STATUSES.has(status)) {
		throw new AppError('Invalid order status', 400);
	}

	const resolvedCustomerId = customerId || (customer && customer.id) || null;
	const resolvedCustomerName = (customer && customer.name) || '';

	const connection = await pool.getConnection();
	try {
		await connection.beginTransaction();

		let finalCustomerName = resolvedCustomerName;
		if (resolvedCustomerId) {
			const [custRows] = await connection.query(
				'SELECT id, name FROM customers WHERE id = ? LIMIT 1',
				[resolvedCustomerId]
			);
			if (custRows.length > 0) {
				finalCustomerName = custRows[0].name;
			}
		}
		if (!finalCustomerName) {
			throw new AppError('Customer is required', 400);
		}

		let finalOrderNumber = orderNumber || (await computeNextOrderNumber(connection));
		const [existing] = await connection.query(
			'SELECT order_number FROM orders WHERE order_number = ? LIMIT 1',
			[finalOrderNumber]
		);
		if (existing.length > 0) {
			finalOrderNumber = await computeNextOrderNumber(connection);
		}

		const normalizedItems = items.map((item, idx) => {
			const unitPrice = Number(item.unitPrice) || 0;
			const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
			const discount = Math.max(0, Number(item.discount) || 0);
			const subtotal = Math.max(0, unitPrice * quantity - discount);
			return {
				itemKey: String(item.id || `${item.productCode || 'PRD'}_${Date.now()}_${idx}`),
				productCode: String(item.productCode || ''),
				productName: String(item.name || ''),
				unitPrice,
				quantity,
				discount,
				subtotal
			};
		});

		const totalAmount = normalizedItems.reduce((sum, item) => sum + item.subtotal, 0);
		const now = new Date();
		const { orderDate, orderTime } = formatOrderDateTime(now);

		await connection.query(
			`INSERT INTO orders
			 (order_number, customer_id, customer_name, order_date, order_time, amount, status, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
			[
				finalOrderNumber,
				resolvedCustomerId,
				finalCustomerName,
				orderDate,
				orderTime,
				totalAmount,
				status,
				now
			]
		);

		const itemRows = normalizedItems.map((item) => [
			item.itemKey,
			finalOrderNumber,
			item.productCode,
			item.productName,
			item.unitPrice,
			item.quantity,
			item.discount,
			item.subtotal
		]);

		await connection.query(
			`INSERT INTO order_items
			 (item_key, order_number, product_code, product_name, unit_price, quantity, discount, subtotal)
			 VALUES ?`,
			[itemRows]
		);

		await connection.query('DELETE FROM order_drafts WHERE order_number = ?', [finalOrderNumber]);

		const formattedTotal = Math.round(totalAmount).toLocaleString('en-US');
		await connection.query(
			`INSERT INTO notifications (id, title, subtitle, time_ago, is_read)
			 VALUES (?, ?, ?, 'Just now', FALSE)`,
			[
				`n_${Date.now()}`,
				`Order ${finalOrderNumber} ${status.toLowerCase()}`,
				`${finalCustomerName} · $${formattedTotal} ready for processing`
			]
		);

		await connection.commit();
		return getOrderByNumber(finalOrderNumber);
	} catch (error) {
		await connection.rollback();
		throw error;
	} finally {
		connection.release();
	}
}

async function updateOrderStatus(orderNumber, status) {
	if (!VALID_STATUSES.has(status)) {
		throw new AppError('Status must be Pending, Confirmed, or Cancelled', 400);
	}
	const [result] = await pool.query(
		'UPDATE orders SET status = ? WHERE order_number = ?',
		[status, orderNumber]
	);
	if (result.affectedRows === 0) {
		throw new AppError(`Order ${orderNumber} not found`, 404);
	}
	return getOrderByNumber(orderNumber);
}

module.exports = {
	getDashboardOverview,
	getRecentOrders,
	getOrders,
	getOrderByNumber,
	computeNextOrderNumber,
	saveOrderDraft,
	createOrder,
	updateOrderStatus
};
