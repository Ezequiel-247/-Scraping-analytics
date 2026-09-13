CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  brand TEXT,
  url TEXT,
  image TEXT,
  price REAL,
  available INTEGER,
  stock_status TEXT,
  category TEXT,
  origin_page INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
