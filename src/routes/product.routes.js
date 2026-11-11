const express = require('express');
const { listProducts } = require('../controllers/catalog.controller');

const router = express.Router();

router.get('/', listProducts);

module.exports = router;

