const catalogService = require('../services/catalog.service');

async function listCustomers(req, res, next) {
	try {
		const customers = await catalogService.getCustomers(req.query.query);
		res.status(200).json({ customers });
	} catch (error) {
		next(error);
	}
}

async function listProducts(req, res, next) {
	try {
		const products = await catalogService.getProducts(req.query.query);
		res.status(200).json({ products });
	} catch (error) {
		next(error);
	}
}

async function listNotifications(req, res, next) {
	try {
		const notifications = await catalogService.getNotifications();
		res.status(200).json({ notifications });
	} catch (error) {
		next(error);
	}
}

async function getProfile(req, res, next) {
	try {
		const profile = await catalogService.getUserProfile();
		res.status(200).json(profile);
	} catch (error) {
		next(error);
	}
}

module.exports = {
	listCustomers,
	listProducts,
	listNotifications,
	getProfile
};

