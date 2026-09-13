const axios = require('axios');
const cheerio = require('cheerio');

const delay_ms = 500;
const max_pages = 100;


const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
};
const fs = require('fs');

/*
  Propósito: Pausar la ejecución del hilo asíncrono durante un tiempo determinado.
  Precondiciones: ms debe ser un número entero positivo (milisegundos).
  Parámetros: ms (number) - Tiempo de espera en milisegundos.
  Postcondiciones: Devuelve una Promesa que se resuelve tras transcurrir el tiempo indicado.
*/
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const getCategoryFromUrl = (url) => {
  /*
    Propósito: Extraer el segmento final de la ruta de una URL para identificar la categoría.
    Precondiciones: url debe ser un string con un formato de URL válido.
    Parámetros: url (string) - La URL completa de la categoría.
    Postcondiciones: Devuelve un string con el nombre de la categoría o null si no se encuentra.
  */
  const path = new URL(url).pathname;
  const parts = path.split('/').filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : null;
};

const isProductListBlock = (block) => {
  /*
    Propósito: Comprobar si un bloque de datos estructurados corresponde a una lista de productos.
    Precondiciones: block debe ser un objeto JSON parseado.
    Parámetros: block (object) - Objeto extraído del script ld+json.
    Postcondiciones: Devuelve un booleano (true si es un ItemList con elementos, false en caso contrario).
  */
  return block['@type'] === 'ItemList' && Array.isArray(block.itemListElement);
};

const extractProductsFromJsonLd = ($) => {
  /*
    Propósito: Buscar y extraer el arreglo de productos crudos desde los scripts JSON-LD de la página.
    Precondiciones: $ debe ser una instancia de Cheerio cargada con el HTML de la página.
    Parámetros: $ (function) - Instancia de Cheerio del documento HTML.
    Postcondiciones: Devuelve un array de objetos con los productos crudos o un array vacío si no halla coincidencias.
  */
  let items = [];
  $('script[type="application/ld+json"]').each((_ ,element) => {
    try {
      const rawText = $(element).html();
      const jsonData = JSON.parse(rawText);
      if (isProductListBlock(jsonData)) {
        items = jsonData.itemListElement;
      }
    } catch (error) {
      //el catch no puse error por que pense que pueden llegar productos malformados o scripts 
      //que no pueden llegar a ser productos
      //aca puede haber algun marco de mejora en el codigo
    }
  });
  return items;
};

//SE PODRIA HABER UTILIZADO LA LIBRERIA Joi
const normalizeProductData = (wrapper, page, category) => {
  /*
    Propósito: Normalizar la estructura compleja de un producto de Schema.org en un objeto plano y limpio.
    Precondiciones: wrapper, page y category deben estar definidos y tener valores válidos.
    Parámetros: 
      - wrapper (object) - Contenedor o item del producto crudo.
      - page (number) - Número de página actual de origen.
      - category (string) - Categoría a la que pertenece el producto.
    Postcondiciones: Devuelve un objeto estructurado con las propiedades normalizadas del producto.
  */
  const item = wrapper.item || wrapper;
  const offer =  item.offers?.offers?.[0] || item.offers || {};
  const availability = offer.availability || '';
  const isOutOfStock = availability.includes('OutOfStock');

  return {
    name: item.name || '',
    brand: item.brand?.name || item.brand || '',
    url: item.url || '',
    image: Array.isArray(item.image) ? item.image[0] : (item.image || null),
    price: isOutOfStock ? null : (offer.lowPrice ?? offer.price ?? null),
    available: !isOutOfStock,
    stockStatus: availability || 'Unknown',
    category,
    originPage: page,
  }
};

const builPageUrl = (baseUrl, page) => {  
  /*
    Propósito: Construir la URL de paginación asegurando el manejo correcto de parámetros previos.
    Precondiciones: baseUrl debe ser un string de URL válido y page un entero mayor a 0.
    Parámetros: 
      - baseUrl (string) - URL base de la categoría.
      - page (number) - Número de página a consultar.
    Postcondiciones: Devuelve un string con la URL completa y formateada para la petición de paginación.
  */
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}page=${page}`;
};

const fetchPageHtml = async (pageUrl) => {
  /*
    Propósito: Realizar una solicitud HTTP GET para descargar el HTML y prepararlo para su análisis.
    Precondiciones: pageUrl debe ser una URL accesible por la red.
    Parámetros: pageUrl (string) - URL de la página a scrapear.
    Postcondiciones: Devuelve una instancia de Cheerio (`$`) con el contenido del DOM cargado.
  */
  const { data: html } = await axios.get(pageUrl, { headers, timeout: 10000 });
  return cheerio.load(html);
};

const hasNextPageToFetch = (page, allProducts, maxPages, maxProducts) => {
  /*
    Propósito: Evaluar la condición de corte del bucle de scraping según límites de páginas y productos.
    Precondiciones: page y los límites numéricos deben ser válidos.
    Parámetros: 
      - page (number) - Página actual.
      - allProducts (array) - Acumulador de productos recolectados.
      - maxPages (number) - Límite máximo de páginas permitidas.
      - maxProducts (number) - Límite máximo de productos permitidos.
    Postcondiciones: Devuelve true si debe continuar iterando, o false si alcanzó algún límite.
  */
  const withinPageLimit = page < maxPages;
  const withinProductLimit = allProducts.length < maxProducts;
  return withinPageLimit && withinProductLimit;
};

const scrapeCategory = async (baseUrl, options = {}) => {
  /*
    Propósito: Orquestar el proceso completo de scraping iterando sobre las páginas de una categoría.
    Precondiciones: baseUrl debe ser válida y options puede contener restricciones opcionales.
    Parámetros: 
      - baseUrl (string) - URL inicial de la categoría.
      - options (object) - Objeto de configuración con maxPages y maxProducts.
    Postcondiciones: Devuelve una promesa que resuelve un array con todos los productos normalizados y recortados al límite.
  */
  const maxPages = options.maxPages ?? max_pages;
  const maxProducts = options.maxProducts ?? Infinity;

  let page = 1;
  const allProducts = [];
  let category = getCategoryFromUrl(baseUrl);

  console.log(`Iniciando scraping: ${baseUrl}`);

  while (hasNextPageToFetch(page, allProducts, maxPages, maxProducts)) {
    const pageUrl = builPageUrl(baseUrl, page);
    
    try {
      console.log(`[Página ${page}] Fetching HTML...`);
      const $ = await fetchPageHtml(pageUrl);
      const rawItems = extractProductsFromJsonLd($);

      if (rawItems.length === 0) {
        console.log(`[Page ${page}] No products found. Finalizing scraping.`);
        break;
      }

      const pageProducts = rawItems.map(item => normalizeProductData(item, page, category));
      
      allProducts.push(...pageProducts);
      
      console.log(`[Page ${page}] Products found: ${pageProducts.length}. Total accumulated: ${allProducts.length}.`);
      page+= 1;
      await delay(delay_ms);
    } catch (error) {
      console.error(`[Page ${page}] Error processing page:`, error.message);
      break;  
    }
  }
  return allProducts.slice(0, maxProducts);
};

const saveResultsToJson = (results, getCategoryFromUrl) => {
  /*
    Propósito: Persistir los resultados obtenidos del scraping en un archivo JSON local.
    Precondiciones: results debe ser un array y getCategoryFromUrl un string válido.
    Parámetros: 
      - results (array) - Colección de productos normalizados.
      - getCategoryFromUrl (string) - Nombre de la categoría extraída para nombrar el archivo.
    Postcondiciones: Genera un archivo en disco con el formato JSON formateado.
  */
  const outputPath = `productos-${getCategoryFromUrl}.json`;
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`Results saved in: ${outputPath}`);
};

async function run(input) {
  /*
    Propósito: Función de ejecución principal (Entry Point) que inicializa el scraper con parámetros dados.
    Precondiciones: input debe ser un objeto que contenga al menos la propiedad url.
    Parámetros: input (object) - Objeto de configuración inicial del proceso.
    Postcondiciones: Ejecuta el flujo completo, imprime métricas por consola, guarda el archivo y devuelve los resultados.
  */
  if (!input || !input.url) {
    throw new Error('Se requiere una URL para iniciar el scraping.');
  }

  const { url, maxPages, maxProducts } = input;
  
  const results = await scrapeCategory(url, { maxPages, maxProducts });
  
  console.log(`\n--- Final Results ---`);
  console.log(`Total products found: ${results.length}`);
  if (results.length > 0) {
    console.table(results.slice(0, 5));
  }

  saveResultsToJson(results, getCategoryFromUrl(input.url));

  return results;
}

if (require.main === module) {
  const scrapingInput = {
    url: process.env.SCRAPER_URL,
    maxPages: Number(process.env.MAX_PAGES) || 10,
  };

  if (!scrapingInput.url) {
    console.error('Error: falta la variable de entorno SCRAPER_URL.');
    process.exitCode = 1;
  } else {
    run(scrapingInput).catch((error) => {
      console.error('Scraping failed:', error.message);
      process.exitCode = 1;
    });
  }
}

module.exports = { 
  run, 
  scrapeCategory,
  getCategoryFromUrl,
  isProductListBlock,
  normalizeProductData,
  builPageUrl,
  has_next_page_to_fetch: hasNextPageToFetch
};

//CLASE CSS = vtex-search-result-3-x-galleryItem