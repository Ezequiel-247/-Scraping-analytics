const db = require('../db/db');

const listProducts = (req, res) => {
  const { brand, category, available, limit } = req.query;

  let query = 'SELECT * FROM products WHERE 1 = 1';
  const params = [];

  if (brand) {
    query += ' AND LOWER(brand) = ?';
    params.push(String(brand).toLowerCase());
  }

  if (category) {
    query += ' AND LOWER(category) = ?';
    params.push(String(category).toLowerCase());
  }

  if (available !== undefined) {
    const normalizedAvailable = String(available).toLowerCase() === 'true' ? 1 : 0;
    query += ' AND available = ?';
    params.push(normalizedAvailable);
  }

  query += ' ORDER BY id DESC';

  if (limit) {
    const parsedLimit = Number(limit);
    if (Number.isFinite(parsedLimit) && parsedLimit > 0) {
      query += ' LIMIT ?';
      params.push(parsedLimit);
    }
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Error fetching products:', err.message);
      return res.status(500).json({ error: 'Error fetching products' });
    }

    const products = rows.map((row) => ({
      id: row.id,
      name: row.name,
      brand: row.brand,
      url: row.url,
      image: row.image,
      price: row.price === null ? null : Number(row.price),
      available: Boolean(row.available),
      stockStatus: row.stock_status,
      category: row.category,
      originPage: row.origin_page,
    }));

    return res.json(products);
  });
};

module.exports = {
  listProducts,
};
