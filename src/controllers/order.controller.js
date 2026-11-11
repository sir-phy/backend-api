const orderService = require('../services/order.service');

async function dashboardOverview(req, res, next) {
	try {
		const overview = await orderService.getDashboardOverview(req.query.period || 'This month');
		res.status(200).json(overview);
	} catch (error) {
		next(error);
	}
}

async function recentOrders(req, res, next) {
	try {
		const orders = await orderService.getRecentOrders(req.query.limit);
		res.status(200).json({ orders });
	} catch (error) {
		next(error);
	}
}

async function listOrders(req, res, next) {
	try {
		const result = await orderService.getOrders({
			status: req.query.status,
			query: req.query.query,
			sort: req.query.sort,
			page: req.query.page,
			pageSize: req.query.pageSize
		});
		res.status(200).json(result);
	} catch (error) {
		next(error);
	}
}

async function getOrderDetail(req, res, next) {
	try {
		const order = await orderService.getOrderByNumber(req.params.orderNumber);
		res.status(200).json(order);
	} catch (error) {
		next(error);
	}
}

async function nextOrderNumber(req, res, next) {
	try {
		const orderNumber = await orderService.computeNextOrderNumber();
		res.status(200).json({ orderNumber });
	} catch (error) {
		next(error);
	}
}

async function saveDraft(req, res, next) {
	try {
		const draft = await orderService.saveOrderDraft(req.body || {});
		res.status(200).json(draft);
	} catch (error) {
		next(error);
	}
}

async function createOrder(req, res, next) {
	try {
		const created = await orderService.createOrder(req.body || {});
		res.status(201).json(created);
	} catch (error) {
		next(error);
	}
}

async function patchOrderStatus(req, res, next) {
	try {
		const updated = await orderService.updateOrderStatus(
			req.params.orderNumber,
			req.body && req.body.status
		);
		res.status(200).json(updated);
	} catch (error) {
		next(error);
	}
}

module.exports = {
	dashboardOverview,
	recentOrders,
	listOrders,
	getOrderDetail,
	nextOrderNumber,
	saveDraft,
	createOrder,
	patchOrderStatus
};
