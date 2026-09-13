const assert = require('assert');
const app = require('../app');
const db = require('../db/db');

const closeServer = (server) => new Promise((resolve, reject) => {
  server.close((error) => {
    if (error) reject(error);
    else resolve();
  });
});

const closeDatabase = () => new Promise((resolve, reject) => {
  db.close((error) => {
    if (error) reject(error);
    else resolve();
  });
});
 
const test = async () => {
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  try {
    const healthResponse = await fetch(`${baseUrl}/api/health`);
    const healthData = await healthResponse.json();
    assert.strictEqual(healthResponse.status, 200);
    assert.strictEqual(healthData.ok, true);

    const docsResponse = await fetch(`${baseUrl}/api-docs.json`);
    const docsData = await docsResponse.json();
    assert.strictEqual(docsResponse.status, 200);
    assert.strictEqual(docsData.openapi, '3.0.3');
    assert.ok(docsData.paths['/api/products']);
    assert.ok(docsData.paths['/api/stats']);

    const productsResponse = await fetch(`${baseUrl}/api/products`);
    const productsData = await productsResponse.json();
    assert.strictEqual(productsResponse.status, 200);
    assert.ok(Array.isArray(productsData));
    assert.ok(productsData.length > 0);

    const firstProduct = productsData[0];
    assert.ok(firstProduct.name !== undefined);
    assert.ok(firstProduct.price === null || typeof firstProduct.price === 'number');

    const limitedProductsResponse = await fetch(`${baseUrl}/api/products?limit=3`);
    const limitedProductsData = await limitedProductsResponse.json();
    assert.strictEqual(limitedProductsResponse.status, 200);
    assert.ok(Array.isArray(limitedProductsData));
    assert.ok(limitedProductsData.length <= 3);

    const filteredProductsResponse = await fetch(`${baseUrl}/api/products?available=true&limit=2`);
    const filteredProductsData = await filteredProductsResponse.json();
    assert.strictEqual(filteredProductsResponse.status, 200);
    assert.ok(Array.isArray(filteredProductsData));
    filteredProductsData.forEach((product) => {
      assert.strictEqual(product.available, true);
    });

    const unavailableProductsResponse = await fetch(`${baseUrl}/api/products?available=false`);
    const unavailableProductsData = await unavailableProductsResponse.json();
    assert.strictEqual(unavailableProductsResponse.status, 200);
    unavailableProductsData.forEach((product) => {
      assert.strictEqual(product.available, false);
      assert.strictEqual(
        product.price,
        null,
        `Producto agotado "${product.name}" no debería tener price`
      );
    });

    const brandResponse = await fetch(
      `${baseUrl}/api/products?brand=${encodeURIComponent(firstProduct.brand)}`
    );
    const brandData = await brandResponse.json();
    assert.strictEqual(brandResponse.status, 200);
    assert.ok(brandData.length > 0);
    brandData.forEach((product) => {
      assert.strictEqual(product.brand.toLowerCase(), firstProduct.brand.toLowerCase());
    });

    const categoryResponse = await fetch(
      `${baseUrl}/api/products?category=${encodeURIComponent(firstProduct.category)}`
    );
    const categoryData = await categoryResponse.json();
    assert.strictEqual(categoryResponse.status, 200);
    assert.ok(categoryData.length > 0);
    categoryData.forEach((product) => {
      assert.strictEqual(product.category.toLowerCase(), firstProduct.category.toLowerCase());
    });

    for (const invalidLimit of ['abc', '-5']) {
      const invalidLimitResponse = await fetch(
        `${baseUrl}/api/products?limit=${invalidLimit}`
      );
      const invalidLimitData = await invalidLimitResponse.json();
      assert.strictEqual(invalidLimitResponse.status, 200);
      assert.strictEqual(invalidLimitData.length, productsData.length);
    }

    const missingRouteResponse = await fetch(`${baseUrl}/api/ruta-que-no-existe`);
    assert.strictEqual(missingRouteResponse.status, 404);

    const statsResponse = await fetch(`${baseUrl}/api/stats`);
    const statsData = await statsResponse.json();
    assert.strictEqual(statsResponse.status, 200);
    assert.ok(statsData.totalProducts >= 0);
    assert.ok(statsData.overallAveragePrice === null || typeof statsData.overallAveragePrice === 'number');
    assert.ok(Array.isArray(statsData.avgPriceByBrand));
    statsData.avgPriceByBrand.forEach((item) => {
      assert.ok(Number.isInteger(item.pricedCount));
      assert.ok(Number.isInteger(item.totalCount));
      assert.ok(item.pricedCount <= item.totalCount);
    });
    assert.ok(Array.isArray(statsData.topExpensive));
    assert.ok(Array.isArray(statsData.topCheapest));
    assert.ok(typeof statsData.availability === 'object');

    statsData.topExpensive.forEach((item) => {
      assert.ok(item.price === null || typeof item.price === 'number');
    });

    statsData.topCheapest.forEach((item) => {
      assert.ok(item.price === null || typeof item.price === 'number');
    });

    console.log('Tests OK');
  } catch (error) {
    console.error('Tests failed:', error.message);
    process.exitCode = 1;
  } finally {
    await closeServer(server);
    await closeDatabase();
  }
};

test();
