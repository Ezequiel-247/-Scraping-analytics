function createOpenApiSpec(port) {
  return {
    openapi: '3.0.3',
    info: {
      title: 'Bebidas Data API',
      version: '1.0.0',
      description: 'API de solo lectura para consultar productos de bebidas scrapeadas y sus estadísticas.',
    },
    servers: [
      { url: `http://localhost:${port}`, description: 'Desarrollo local' },
    ],
    tags: [
      { name: 'Health', description: 'Estado del servicio' },
      { name: 'Products', description: 'Consulta del catálogo' },
      { name: 'Stats', description: 'Métricas agregadas del catálogo' },
    ],
    paths: {
      '/api/health': {
        get: {
          tags: ['Health'],
          summary: 'Verifica que la API esté disponible',
          responses: {
            200: {
              description: 'Servicio disponible',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Health' } } },
            },
          },
        },
      },
      '/api/products': {
        get: {
          tags: ['Products'],
          summary: 'Lista productos del catálogo',
          parameters: [
            { name: 'brand', in: 'query', schema: { type: 'string' }, description: 'Filtra por marca' },
            { name: 'category', in: 'query', schema: { type: 'string' }, description: 'Filtra por categoría' },
            { name: 'available', in: 'query', schema: { type: 'boolean' }, description: 'Filtra por disponibilidad' },
            { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1 }, description: 'Limita la cantidad de resultados' },
          ],
          responses: {
            200: {
              description: 'Lista de productos',
              content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Product' } } } },
            },
          },
        },
      },
      '/api/stats': {
        get: {
          tags: ['Stats'],
          summary: 'Obtiene métricas agregadas del catálogo',
          responses: {
            200: {
              description: 'Estadísticas del catálogo',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Stats' } } },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        Health: {
          type: 'object',
          properties: {
            ok: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Products analytics backend is running' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            brand: { type: 'string' },
            url: { type: 'string', format: 'uri' },
            image: { type: 'string', format: 'uri', nullable: true },
            price: { type: 'number', nullable: true },
            available: { type: 'boolean' },
            stockStatus: { type: 'string' },
            category: { type: 'string' },
            originPage: { type: 'integer' },
          },
        },
        BrandAverage: {
          type: 'object',
          properties: {
            brand: { type: 'string' },
            averagePrice: { type: 'number' },
            pricedCount: { type: 'integer' },
            totalCount: { type: 'integer' },
            count: { type: 'integer', description: 'Alias de totalCount' },
          },
        },
        Availability: {
          type: 'object',
          properties: {
            available: { type: 'integer' },
            unavailable: { type: 'integer' },
            availablePercent: { type: 'number' },
            unavailablePercent: { type: 'number' },
          },
        },
        RankedProduct: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            brand: { type: 'string' },
            price: { type: 'number' },
            url: { type: 'string', format: 'uri' },
            category: { type: 'string' },
          },
        },
        Stats: {
          type: 'object',
          properties: {
            totalProducts: { type: 'integer' },
            overallAveragePrice: { type: 'number', nullable: true },
            avgPriceByBrand: { type: 'array', items: { $ref: '#/components/schemas/BrandAverage' } },
            availability: { $ref: '#/components/schemas/Availability' },
            topExpensive: { type: 'array', items: { $ref: '#/components/schemas/RankedProduct' } },
            topCheapest: { type: 'array', items: { $ref: '#/components/schemas/RankedProduct' } },
            generatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  };
}

module.exports = createOpenApiSpec;
