const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.join(__dirname, '..', 'data', 'products.db');
const DATA_DIR = path.join(__dirname, '..', 'data');

function resolveJsonPath() {
  if (!fs.existsSync(DATA_DIR)) {
    return path.join(DATA_DIR, 'products.json');
  }

  const files = fs.readdirSync(DATA_DIR).filter((file) => file.endsWith('.json')).sort();

  if (files.includes('products.json')) {
    return path.join(DATA_DIR, 'products.json');
  }

  const namedMatch = files.find((file) => /^productos-.*\.json$/i.test(file));
  return namedMatch ? path.join(DATA_DIR, namedMatch) : path.join(DATA_DIR, 'products.json');
}

const JSON_PATH = resolveJsonPath();

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('No se pudo abrir la base de datos:', err.message);
    process.exit(1);
  }

  db.run(`
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
    )
  `, (createErr) => {
    if (createErr) {
      console.error('Error creando la tabla:', createErr.message);
      process.exit(1);
    }

    importProducts();
  });
});

function parseNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeAvailable(value) {
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'number') return value > 0 ? 1 : 0;
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    if (['true', 'yes', 'disponible', 'available'].includes(lower)) return 1;
    if (['false', 'no', 'agotado', 'unavailable', 'sold out'].includes(lower)) return 0;
  }
  return 0;
}

function importProducts() {
  fs.readFile(JSON_PATH, 'utf8', (err, data) => {
    if (err) {
      console.error('No se pudo leer el JSON de productos:', err.message);
      process.exit(1);
    }

    let products;
    try {
      products = JSON.parse(data);
    } catch (parseErr) {
      console.error('El JSON no es válido:', parseErr.message);
      process.exit(1);
    }

    if (!Array.isArray(products) || products.length === 0) {
      console.log('No hay productos para importar.');
      db.close();
      return;
    }

    const insertQuery = `
      INSERT INTO products (
        name,
        brand,
        url,
        image,
        price,
        available,
        stock_status,
        category,
        origin_page
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.serialize(() => {
      db.run('DELETE FROM products', (deleteErr) => {
        if (deleteErr) {
          console.error('Error limpiando la tabla productos:', deleteErr.message);
          db.close();
          process.exit(1);
        }

        products.forEach((product, index) => {
          const values = [
            product.name || '',
            product.brand || '',
            product.url || '',
            product.image || '',
            parseNumber(product.price),
            normalizeAvailable(product.available),
            product.stockStatus || product.stock_status || '',
            product.category || '',
            product.originPage || product.origin_page || 0,
          ];

          db.run(insertQuery, values, (insertErr) => {
            if (insertErr) {
              console.error('Error insertando producto:', insertErr.message);
            }

            if (index === products.length - 1) {
              db.get('SELECT COUNT(*) AS total FROM products', (countErr, row) => {
                if (countErr) {
                  console.error('Error verificando insert:', countErr.message);
                  db.close();
                  process.exit(1);
                }

                console.log(`Importación finalizada. ${row.total} productos procesados.`);
                db.close();
              });
            }
          });
        });
      });
    });
  });
}
