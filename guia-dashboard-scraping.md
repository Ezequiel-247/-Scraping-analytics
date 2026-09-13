# Guía paso a paso: Dashboard de análisis de datos scrapeados

Proyecto: scraper de bebidas (Node.js + Axios + Cheerio) + backend con estadísticas + frontend Bebidas Data en React.

---

## 1. Organizar el repo y los datos

Creá una carpeta base con tres subcarpetas:

```
/scraper    → beverageScraper.js
/backend    → API
/frontend   → React
```

Corré el scraper una vez y guardá el `productos-*.json` dentro de `/backend/data`. La URL se
proporciona mediante `SCRAPER_URL` y no se almacena en el código del repositorio. Esto evita
exponer el origen privado y también evita depender de scrapear en vivo cada vez que alguien visite
tu portfolio.

Desde PowerShell:

```powershell
$env:SCRAPER_URL="https://tu-url-privada"
$env:MAX_PAGES="10"
node scraper/beverageScraper.js
```

Si `SCRAPER_URL` no está definida, el scraper termina con error y no realiza ninguna petición.

## 1.1 Elegir base de datos: ¿relacional o no relacional?

Antes de armar el backend, conviene definir dónde van a vivir los datos scrapeados. El flujo completo queda así:

```
scraper (Node.js) → JSON → importás a una BD → backend lee de la BD → frontend consume la API
```

**Decisión: relacional (SQLite).** Análisis del dataset real (`productos-jugos-y-jugos-en-polvo.json`, 172 productos):

- Todos los objetos comparten la misma estructura plana: `name`, `brand`, `url`, `image`, `price`, `available`, `stockStatus`, `category`, `originPage`. No hay relaciones complejas, ni jerarquías de categorías, ni variantes de producto.
- **Las consultas necesarias son analíticas**, justo lo que SQL resuelve mejor: `AVG(price) GROUP BY brand` (precio promedio por marca), `COUNT(*) WHERE available = 0` (agotados), `ORDER BY price DESC LIMIT 10` (top 10 más caros). Esto es posible en Mongo con aggregation pipelines, pero más verboso.
- **Esquema fijo y conocido de antemano** — no se aprovecha la flexibilidad de esquema que ofrece un NoSQL.
- **Dataset chico** (172 filas): ninguna base tiene problema de performance a este volumen: la decisión pasa por claridad y capacidad de explicarla en una entrevista, no por escalabilidad.
- SQLite no requiere servicio de base de datos aparte (cero configuración, el archivo `.db` vive en el proyecto), lo cual es ideal para el free tier de Render.

**Cuándo usar NoSQL en cambio:** si se escalara a scrapear múltiples categorías con estructuras muy variables entre sí, o si se quisiera guardar snapshots históricos de precio por producto en el tiempo (ahí un documento por snapshot tiene sentido). No es el caso de este proyecto.

**Estructura de carpetas actualizada:**

```
/backend
  /data
    productos-jugos.json      ← output crudo del scraper
  /db
    db.js                     ← conexión SQLite
  /seeders
    importProducts.js         ← script que lee el JSON e inserta en la tabla
  schema.sql                  ← definición de la tabla "products"
  /routes
    products.js                ← GET /api/products
    stats.js                    ← GET /api/stats
  app.js
```

**Tabla `products` (columnas basadas en lo que ya normaliza el scraper):**

```sql
CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  brand TEXT,
  url TEXT,
  image TEXT,
  price REAL,
  available BOOLEAN,
  stock_status TEXT,
  category TEXT,
  origin_page INTEGER
);
```

**Flujo de trabajo:**

1. Correr el scraper → genera el JSON (ya funciona).
2. Correr `seed.js` una vez → lee el JSON e inserta todo en SQLite.
3. El backend (Express) lee de la base con queries SQL, no del JSON directo.
4. `/api/stats` hace las agregaciones con SQL (`AVG`, `GROUP BY`, `COUNT`) en vez de calcularlo en JS.

## 2. Armar el backend con Express

Creá un proyecto Node con Express. Sumá dos endpoints:

- `GET /api/products` → devuelve el JSON completo, con filtros opcionales por query params como `?brand=` o `?available=`
- `GET /api/stats` → calcula y devuelve precio promedio por marca, % disponible vs agotado, y el top 10 más caro/barato

Toda la lógica de cálculo va en un archivo separado (`stats.js`) para que quede prolijo.

## 3. Probar la API localmente

Con Postman, Thunder Client o simplemente el navegador, verificá que `/api/products` y `/api/stats` devuelvan JSON correcto antes de tocar el frontend. Así aislás errores: si algo falla después, sabés que es del lado del React y no del backend.

## 4. Crear el proyecto React

Usá Vite (más rápido que create-react-app):

```bash
npm create vite@latest frontend -- --template react
```

Instalá Recharts para los gráficos y Axios para consumir tu API:

```bash
npm install recharts axios
```

## 5. Construir los componentes de datos

Armá 3-4 componentes:

- Tabla/grid de productos con filtro por marca y disponibilidad
- Gráfico de barras de precio promedio por marca
- Gráfico de torta con disponible vs agotado
- Lista de top 10 más caros

Cada componente hace su propio fetch a tu API o recibe los datos como props desde un componente padre que centraliza las llamadas.

## 6. Darle estilo visual

Usá Tailwind CSS para que se vea prolijo rápido sin escribir mucho CSS a mano. Priorizá que se vea limpio y responsive antes que "lindo": cards con sombra suave, buena tipografía, espaciado consistente. Esto es lo primero que ve un reclutador.

## 7. Deployar backend y frontend

- **Backend**: subilo a Render como Web Service (free tier), apuntando a tu carpeta `/backend`.
- **Frontend**: subilo a Render como Static Site, o a Vercel/Netlify (recomendado para evitar el "cold start" de 15 min de inactividad del free tier de Render).

Acordate de configurar la URL del backend como variable de entorno en el frontend (`VITE_API_URL`) para que apunte a la URL pública de Render una vez deployado.

## 8. Pulir el README y subir todo a GitHub

Escribí un README con:

- Qué hace el proyecto
- Stack usado
- Cómo correrlo localmente
- Link al demo deployado + un par de screenshots o un GIF corto del dashboard funcionando

Esto es lo que un reclutador lee en 30 segundos, así que priorizá claridad sobre extensión.

---

### Notas sobre Render (free tier, verificado sept. 2026)

- Hasta 25 servicios por workspace en el plan gratuito.
- Web services: 512 MB RAM, CPU fraccionada.
- Se "duermen" tras 15 min de inactividad (tardan ~1 min en despertar).
- 750 horas gratis por mes en el workspace.
- La base de datos Postgres gratuita expira a los 30 días.

Para un portfolio esto no es un problema — solo implica que la primera visita después de un rato de inactividad puede tardar unos segundos más en cargar.
