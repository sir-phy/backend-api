const express = require('express');
const {
	recentOrders,
	nextOrderNumber,
	saveDraft,
	listOrders,
	getOrderDetail,
	createOrder,
	patchOrderStatus
} = require('../controllers/order.controller');

const router = express.Router();

router.get('/recent', recentOrders);
router.get('/next-number', nextOrderNumber);
router.post('/draft', saveDraft);
router.get('/', listOrders);
router.post('/', createOrder);
router.get('/:orderNumber', getOrderDetail);
router.patch('/:orderNumber/status', patchOrderStatus);

module.exports = router;
