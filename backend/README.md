# Backend del dashboard de productos

Este backend expone una API REST para consultar productos scrapeados y calcular estadísticas útiles para un dashboard analítico.

## Objetivo

El proyecto tiene dos capas bien diferenciadas:

1. Scraping de productos desde una fuente configurada de forma privada
2. Exposición de esos datos a través de una API para analizar precios, disponibilidad y marcas

La idea es transformar información no estructurada del sitio web en datos reutilizables para su visualización en un frontend o para análisis posteriores.

---

## Stack principal

- Node.js
- Express
- SQLite
- dotenv
- CORS
- Helmet
- express-rate-limit
- swagger-ui-express
- Node.js `assert` y `fetch` para pruebas de integración

---

## Flujo del proyecto

El flujo de trabajo del backend es el siguiente:

1. El scraper genera un archivo JSON con productos.
2. El script de carga `seeders/importProducts.js` lee ese JSON.
3. Normaliza los datos y los inserta en SQLite.
4. El backend consulta la base de datos para responder las peticiones HTTP.
5. Las pruebas de integración verifican los endpoints y cierran el servidor y la conexión SQLite.
6. El frontend consume los endpoints y visualiza la información.

---

## Estructura de carpetas

```text
backend/
├── app.js
├── .env
├── README.md
├── package.json
├── data/
│   ├── products.json
│   └── products.db
├── db/
│   └── db.js
├── controllers/
│   ├── productsController.js
│   └── statsController.js
├── routes/
│   ├── products.js
│   └── stats.js
├── docs/
│   └── openapi.js
├── seeders/
│   └── importProducts.js
├── test/
│   └── integrationTest.js
└── schema.sql
```

---

## ¿Qué hace cada parte?

### `app.js`

Es el punto de entrada del servidor. Aquí se:

- carga la configuración del `.env`
- inicializa Express
- habilita Helmet para agregar headers HTTP de seguridad
- restringe CORS al origen configurado en `FRONTEND_URL`
- aplica rate limiting para limitar solicitudes excesivas
- define los endpoints base
- levanta el servidor en el puerto configurado

El servidor solo se inicia automáticamente cuando `app.js` se ejecuta directamente.
Esto permite importar la aplicación desde las pruebas sin levantar un segundo servidor
innecesariamente.

Ejemplo:

```js
require('dotenv').config();
const app = express();
const PORT = Number(process.env.PORT) || 3000;
```

---

### `db/db.js`

Configura la conexión con SQLite usando la ruta definida en `.env`.

Esto permite que el backend no dependa de un JSON en tiempo real para responder, sino de una base persistente.

```js
const DB_PATH = process.env.DB_PATH
  ? path.resolve(process.cwd(), process.env.DB_PATH)
  : path.join(__dirname, '..', 'data', 'products.db');
```

La base es un archivo local llamado `products.db` dentro de `data/`.

---

### `schema.sql`

Define la estructura de la tabla `products`.

La tabla guarda información clave de cada producto:

- `id`
- `name`
- `brand`
- `url`
- `image`
- `price`
- `available`
- `stock_status`
- `category`
- `origin_page`
- `created_at`

Esto le da una forma ordenada a los datos para consultas analíticas.

---

### `seeders/importProducts.js`

Este script hace la carga inicial de datos desde el JSON exportado por el scraper.

Su flujo es:

1. localizar el JSON de productos en `data/`
2. validar que lleguen productos
3. crear la tabla si no existe
4. limpiar los registros anteriores para evitar duplicados al volver a ejecutar el seed
5. recorrer el array de productos
6. normalizar valores
7. insertar cada producto en SQLite

#### Normalización que hace

- convierte `price` a número cuando existe
- conserva `price` como `null` cuando el dato original no tiene un precio válido
- normaliza `available` a `0` o `1`
- toma `stock_status`
- toma `category`
- toma `origin_page`

Esto asegura que la base de datos tenga un esquema consistente.

---

### `controllers/productsController.js`

Es la capa encargada de devolver productos.

Permite filtros por query params como:

- `brand`
- `category`
- `available`
- `limit`

Ejemplo:

```http
GET /api/products?brand=ADES&available=true&limit=5
```

La consulta se arma dinámicamente con SQL y se ejecuta contra SQLite.

---

### `controllers/statsController.js`

Calcula métricas agregadas para el dashboard.

Entre las estadísticas que devuelve se encuentran:

- total de productos
- precio promedio por marca
- disponibilidad total
- porcentaje disponible vs agotado
- top 10 más caros
- top 10 más baratos

Estas métricas se calculan mediante agregaciones SQL (`AVG`, `GROUP BY`, `COUNT`, `ORDER BY` y
`LIMIT`). `COUNT(price)` se utiliza para contar únicamente productos con precio, mientras que
`COUNT(*)` conserva el total de productos de la marca. Esto evita ponderar un promedio calculado
sin `NULL` usando filas que no participaron del cálculo. Los rankings también excluyen productos
sin precio.

---

### `routes/products.js`

Expone el endpoint:

```http
GET /api/products
```

y delega la lógica al controlador correspondiente.

---

### `routes/stats.js`

Expone el endpoint:

```http
GET /api/stats
```

y devuelve los datos agregados para el frontend.

### `docs/openapi.js`

Define el contrato OpenAPI de la API. La documentación interactiva está disponible en:

```text
http://localhost:3000/api-docs
```

El documento JSON se puede consultar en:

```text
http://localhost:3000/api-docs.json
```

---

## Endpoints disponibles

### `GET /api/health`

Verifica que el backend esté encendido.

Respuesta de ejemplo:

```json
{
  "ok": true,
  "message": "Products analytics backend is running",
  "timestamp": "2026-09-12T00:00:00.000Z"
}
```

---

### `GET /api/products`

Devuelve los productos almacenados en SQLite.

Filtros soportados:

- `brand`
- `category`
- `available=true|false`
- `limit=10`

Ejemplo:

```http
GET /api/products?brand=ADES&available=true&limit=5
```

---

### `GET /api/stats`

Devuelve métricas del catálogo.

Ejemplo de respuesta:

```json
{
  "totalProducts": 172,
  "overallAveragePrice": 97.58,
  "avgPriceByBrand": [
    {
      "brand": "ADES",
      "averagePrice": 325.2,
      "pricedCount": 9,
      "totalCount": 10,
      "count": 10
    }
  ],
  "availability": {
    "available": 144,
    "unavailable": 28,
    "availablePercent": 83.72,
    "unavailablePercent": 16.28
  },
  "topExpensive": [
    { "name": "Producto A", "brand": "ADES", "price": 999, "url": "..." }
  ],
  "topCheapest": [
    { "name": "Producto B", "brand": "ADES", "price": 89, "url": "..." }
  ],
  "generatedAt": "2026-09-12T00:00:00.000Z"
}
```

`overallAveragePrice` y `averagePrice` se calculan en SQLite ignorando precios `NULL`.
En `avgPriceByBrand`, `pricedCount` indica cuántos productos participaron del promedio y
`totalCount` cuántos productos tiene la marca en total. `count` se conserva como alias de
`totalCount` por compatibilidad.

---

## Swagger UI

Swagger permite explorar y probar desde el navegador los endpoints de lectura de la API. No se
agregaron operaciones de escritura ni autenticación porque el backend actual solo expone consultas
públicas de productos, health check y estadísticas.

---

## Cómo correr el backend

Primero instalar dependencias:

```bash
npm install
```

Luego cargar los productos a SQLite:

```bash
npm run seed
```

Y finalmente levantar la API:

```bash
npm start
```

O en modo desarrollo:

```bash
npm run dev
```

### Ejecutar las pruebas

Las pruebas usan `assert` nativo y `fetch`, sin agregar un framework de testing. Cubren:

- health check
- listado de productos con y sin filtros
- filtros por disponibilidad, marca y categoría
- límites válidos e inválidos
- preservación de precios `null`
- estadísticas
- respuesta `404` para rutas inexistentes
- cierre correcto del servidor HTTP y la conexión SQLite

Para ejecutarlas:

```bash
npm test
```

El archivo se llama `integrationTest.js` porque prueba el comportamiento de varios endpoints
y su integración con SQLite, no solamente el recurso de productos.

---

## Variables de entorno

El archivo `.env` contiene la configuración base del proyecto:

```env
PORT=3000
DB_PATH=./data/products.db
FRONTEND_URL=http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174
```

Estas variables permiten ajustar fácilmente el puerto y la ruta de la base de datos sin tocar el código fuente.

`FRONTEND_URL` también define los orígenes permitidos por CORS separados por comas. En desarrollo
local se aceptan `localhost` y `127.0.0.1` en los puertos `5173` y `5174`; en producción debe
reemplazarse por el dominio real del frontend.

El rate limiter permite hasta 100 solicitudes por dirección IP durante una ventana de 15 minutos.
Esta protección es suficiente para el alcance actual de una API pública de solo lectura; no se
agregó autenticación porque los endpoints no exponen operaciones privadas ni de escritura.

---

## Decisiones y correcciones importantes

### Integridad de datos

- El seed limpia la tabla antes de importar para que ejecutarlo varias veces no duplique productos.
- La ruta del JSON se resuelve dinámicamente para tolerar el nombre generado por el scraper.
- Los precios ausentes se almacenan como `null`, no como `0`. En JavaScript, `Number(null)` devuelve
  `0`, por eso se controla explícitamente ese caso.

### Consultas y estadísticas

- Los filtros de productos se construyen con parámetros SQL para evitar interpolar directamente los
  valores recibidos por HTTP.
- Las estadísticas se calculan en SQLite en lugar de cargar todos los productos y agregarlos en
  JavaScript.
- Los productos sin precio no participan de los rankings de precios.

### Pruebas y recursos

- El test de integración usa un puerto aleatorio mediante `server.listen(0)`.
- El servidor HTTP y la conexión SQLite se cierran de forma explícita en un `finally`.
- Las promesas de cierre garantizan que el proceso espere la liberación de ambos recursos.

---

## Objetivo para el frontend

El backend está preparado para que el frontend haga:

- tablas de productos
- filtros por marca y disponibilidad
- gráficos por marca
- porcentaje disponible vs agotado
- ranking según precio

Esto hace que el sitio sea útil para un dashboard de análisis de datos y para presentar el proyecto como portfolio.

---

## Conclusión

Este backend cumple una función clara: transformar datos scrapeados en una API analítica y reutilizable.

No es solo un servicio que devuelve productos: también prepara la información para que un frontend la convierta en gráficos, métricas y visualizaciones. Es decir, la base del dashboard.
