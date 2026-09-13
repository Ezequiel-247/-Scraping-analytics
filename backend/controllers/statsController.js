const db = require('../db/db');

const getStats = (req, res) => {
  const totalProductsQuery = 'SELECT COUNT(*) AS total FROM products';
  const overallAverageQuery = `
    SELECT AVG(price) AS overallAverage
    FROM products
    WHERE price IS NOT NULL
  `;
  const avgByBrandQuery = `
    SELECT
      brand,
      AVG(price) AS averagePrice,
      COUNT(price) AS pricedCount,
      COUNT(*) AS totalCount
    FROM products
    GROUP BY brand
    ORDER BY averagePrice DESC
  `;
  const availabilityQuery = `
    SELECT available, COUNT(*) AS count
    FROM products
    GROUP BY available
  `;
  const topExpensiveQuery = `
    SELECT name, brand, price, url, category
    FROM products
    WHERE price IS NOT NULL
    ORDER BY price DESC
    LIMIT 10
  `;
  const topCheapestQuery = `
    SELECT name, brand, price, url, category
    FROM products
    WHERE price IS NOT NULL
    ORDER BY price ASC
    LIMIT 10
  `;

  db.get(totalProductsQuery, (errTotal, totalRow) => {
    if (errTotal) {
      console.error('Error fetching total products:', errTotal.message);
      return res.status(500).json({ error: 'Error fetching stats' });
    }

    db.get(overallAverageQuery, (errOverall, overallRow) => {
      if (errOverall) {
        console.error('Error fetching overall average:', errOverall.message);
        return res.status(500).json({ error: 'Error fetching stats' });
      }

      db.all(avgByBrandQuery, (errAvg, avgRows) => {
      if (errAvg) {
        console.error('Error fetching average by brand:', errAvg.message);
        return res.status(500).json({ error: 'Error fetching stats' });
      }

      db.all(availabilityQuery, (errAvailability, availabilityRows) => {
        if (errAvailability) {
          console.error('Error fetching availability:', errAvailability.message);
          return res.status(500).json({ error: 'Error fetching stats' });
        }

        db.all(topExpensiveQuery, (errTopExpensive, topExpensiveRows) => {
          if (errTopExpensive) {
            console.error('Error fetching top expensive:', errTopExpensive.message);
            return res.status(500).json({ error: 'Error fetching stats' });
          }

          db.all(topCheapestQuery, (errTopCheapest, topCheapestRows) => {
            if (errTopCheapest) {
              console.error('Error fetching top cheapest:', errTopCheapest.message);
              return res.status(500).json({ error: 'Error fetching stats' });
            }

            const availabilityMap = {};
            availabilityRows.forEach((row) => {
              const key = Number(row.available) === 1 ? 'available' : 'unavailable';
              availabilityMap[key] = Number(row.count);
            });

            const totalProducts = Number(totalRow?.total || 0);
            const available = availabilityMap.available || 0;
            const unavailable = availabilityMap.unavailable || 0;

            const stats = {
              totalProducts,
              overallAveragePrice: overallRow?.overallAverage === null
                ? null
                : Number(Number(overallRow?.overallAverage || 0).toFixed(2)),
              avgPriceByBrand: avgRows.map((row) => ({
                brand: row.brand,
                averagePrice: Number(Number(row.averagePrice).toFixed(2)),
                pricedCount: Number(row.pricedCount),
                totalCount: Number(row.totalCount),
                count: Number(row.totalCount),
              })),
              availability: {
                available,
                unavailable,
                availablePercent: totalProducts ? Number(((available / totalProducts) * 100).toFixed(2)) : 0,
                unavailablePercent: totalProducts ? Number(((unavailable / totalProducts) * 100).toFixed(2)) : 0,
              },
              topExpensive: topExpensiveRows.map((row) => ({
                name: row.name,
                brand: row.brand,
                price: Number(row.price),
                url: row.url,
                category: row.category,
              })),
              topCheapest: topCheapestRows.map((row) => ({
                name: row.name,
                brand: row.brand,
                price: Number(row.price),
                url: row.url,
                category: row.category,
              })),
              generatedAt: new Date().toISOString(),
            };

            return res.json(stats);
          });
        });
      });
    });
  });
});
};

module.exports = {
  getStats,
};
