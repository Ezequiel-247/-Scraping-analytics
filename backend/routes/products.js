const express = require('express');
const { listProducts } = require('../controllers/productsController');

const router = express.Router();

router.get('/', listProducts);

module.exports = router;
