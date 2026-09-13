# Bebidas Data

Frontend React para explorar un catálogo de bebidas scrapeadas y consultar estadísticas calculadas por el backend.

## Stack

- React
- Vite
- Tailwind CSS
- React Router
- Recharts
- Lucide React

## Vistas

- `/`: dashboard con métricas, disponibilidad, promedio por marca y rankings.
- `/products`: tabla del catálogo con búsqueda y filtros por marca y disponibilidad.
- `/pipeline`: explicación del flujo real y health check del backend.

La interfaz utiliza el nombre **Bebidas Data** para describir el dominio del dataset sin depender de una marca o supermercado específico.

## Estructura

```text
src/
├── api/
│   └── client.js
├── components/
│   ├── AppShell.jsx
│   ├── DashboardCards.jsx
│   ├── DataPanel.jsx
│   └── Feedback.jsx
├── pages/
│   ├── DashboardPage.jsx
│   ├── PipelinePage.jsx
│   └── ProductsPage.jsx
├── App.jsx
├── index.css
└── main.jsx
```

## API utilizada

El cliente HTTP está centralizado en `src/api/client.js` y consume:

```text
GET http://localhost:3000/api/stats
GET http://localhost:3000/api/products
GET http://localhost:3000/api/health
```

La URL puede cambiarse con una variable de entorno de Vite:

```env
VITE_API_URL=http://localhost:3000/api
```

Las variables `VITE_` son públicas y quedan incluidas en el bundle. Nunca deben contener secretos.

## Seguridad del frontend

- React escapa los valores renderizados y no se utiliza `dangerouslySetInnerHTML`.
- Los enlaces provenientes del scraper se validan con `URL` y solo aceptan protocolos `http` y `https`.
- Los enlaces externos usan `target="_blank"` junto con `rel="noopener noreferrer"`.
- Las imágenes externas usan `loading="lazy"` y `referrerPolicy="no-referrer"`.
- `index.html` incluye una Content Security Policy básica para limitar scripts, imágenes, fuentes y conexiones.

Al desplegar el frontend, la directiva `connect-src` de la CSP debe incluir el dominio real del backend.

## Desarrollo

Instalar dependencias:

```bash
npm install
```

Iniciar Vite:

```bash
npm run dev
```

El frontend queda disponible en `http://localhost:5173`.

## Validación

```bash
npm run lint
npm run build
```

El warning de tamaño del bundle puede aparecer por Recharts; no impide la compilación ni el funcionamiento de la aplicación.
