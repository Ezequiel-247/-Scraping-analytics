import { useEffect, useMemo, useState } from 'react'
import { Boxes, ChevronDown, ExternalLink, Search } from 'lucide-react'
import { getProducts } from '../api/client'
import { ErrorState, LoadingState } from '../components/Feedback'

function getSafeExternalUrl(value) {
  if (!value) return null
  try {
    const parsedUrl = new URL(value)
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:' ? parsedUrl.href : null
  } catch {
    return null
  }
}

function ProductImage({ product }) {
  return product.image ? <img src={product.image} alt="" referrerPolicy="no-referrer" loading="lazy" className="h-10 w-10 rounded-md object-cover" /> : <div className="grid h-10 w-10 place-items-center rounded-md bg-[#182231] text-[#81938d]"><Boxes size={16} /></div>
}

function ProductStatus({ available }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${available ? 'bg-[#4edea3]/10 text-[#4edea3]' : 'bg-[#ffb95f]/10 text-[#ffb95f]'}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{available ? 'Disponible' : 'Agotado'}</span>
}

function ProductOrigin({ product }) {
  const safeUrl = getSafeExternalUrl(product.url)
  return safeUrl ? <a href={safeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-[#4cd7f6] hover:text-white" aria-label={`Ver origen de ${product.name}`}>Ver producto <ExternalLink size={13} /></a> : <span className="text-xs text-[#667873]">No disponible</span>
}

function ProductCard({ product, expanded, onToggle }) {
  return <article className="rounded-xl border border-white/[.07] bg-[#111824]/90 p-4"><button type="button" onClick={onToggle} className="grid w-full grid-cols-[40px_minmax(0,1fr)_auto_18px] items-center gap-3 text-left"><ProductImage product={product} /><div className="min-w-0"><span className="block max-h-10 overflow-hidden text-sm font-medium leading-5 text-[#e8f0ec]">{product.name}</span><span className="mt-1 block truncate text-xs text-[#81938d]">{product.brand || 'Marca no informada'}</span></div><div className="flex flex-col items-end gap-1"><span className="mono whitespace-nowrap text-sm text-[#4cd7f6]">{product.price === null ? 'Sin precio' : `$${product.price.toFixed(2)}`}</span><ProductStatus available={product.available} /></div><ChevronDown size={17} className={`text-[#81938d] transition-transform ${expanded ? 'rotate-180 text-[#4edea3]' : ''}`} aria-hidden="true" /></button>{expanded && <div className="mt-4 grid gap-3 border-t border-white/[.07] pt-4 text-xs sm:grid-cols-2"><div><p className="mono uppercase tracking-wider text-[#667873]">Categoría</p><p className="mt-1 break-words text-[#c4d0cc]">{product.category || 'Sin categoría'}</p></div><div><p className="mono uppercase tracking-wider text-[#667873]">Origen</p><p className="mt-1"><ProductOrigin product={product} /></p></div></div>}</article>
}

function ProductsPage() {
  const [products, setProducts] = useState([])
  const [query, setQuery] = useState('')
  const [brand, setBrand] = useState('')
  const [availability, setAvailability] = useState('all')
  const [expandedIds, setExpandedIds] = useState(new Set())
  const [error, setError] = useState('')

  useEffect(() => { getProducts().then(setProducts).catch((err) => setError(err.message)) }, [])

  const brands = useMemo(() => [...new Set(products.map((product) => product.brand).filter(Boolean))].sort(), [products])
  const filtered = useMemo(() => products.filter((product) => {
    const text = `${product.name} ${product.brand} ${product.category}`.toLowerCase()
    return text.includes(query.toLowerCase()) && (!brand || product.brand === brand) && (availability === 'all' || String(product.available) === availability)
  }), [products, query, brand, availability])

  const toggleProduct = (productId) => {
    setExpandedIds((currentIds) => {
      const nextIds = new Set(currentIds)
      if (nextIds.has(productId)) nextIds.delete(productId)
      else nextIds.add(productId)
      return nextIds
    })
  }

  if (error) return <ErrorState message={error} />
  if (!products.length) return <LoadingState />

  return <div className="space-y-5">
    <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mono text-[10px] uppercase tracking-[.15em] text-[#4edea3]">Inventario · {products.length} registros</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Explorador de productos</h1><p className="mt-2 text-sm text-[#91a19d]">Filtrá el catálogo real importado desde SQLite.</p></div><span className="mono text-xs text-[#81938d]">{filtered.length} resultados</span></section>
    <section className="rounded-xl border border-white/[.07] bg-[#111824]/90 p-4"><div className="grid gap-3 md:grid-cols-[1fr_180px_150px]"><label className="relative"><Search className="absolute left-3 top-3 text-[#81938d]" size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar producto, marca o categoría" className="w-full rounded-lg border border-white/[.08] bg-[#0b111b] py-2.5 pl-10 pr-3 text-sm text-white outline-none placeholder:text-[#667873] focus:border-[#4edea3]/50" /></label><select value={brand} onChange={(event) => setBrand(event.target.value)} className="rounded-lg border border-white/[.08] bg-[#0b111b] px-3 text-sm text-[#c6d2ce] outline-none"><option value="">Todas las marcas</option>{brands.map((item) => <option key={item}>{item}</option>)}</select><select value={availability} onChange={(event) => setAvailability(event.target.value)} className="rounded-lg border border-white/[.08] bg-[#0b111b] px-3 text-sm text-[#c6d2ce] outline-none"><option value="all">Todo el stock</option><option value="true">Disponibles</option><option value="false">Agotados</option></select></div></section>
    <div className="product-cards space-y-3">{filtered.map((product) => <ProductCard key={product.id} product={product} expanded={expandedIds.has(product.id)} onToggle={() => toggleProduct(product.id)} />)}</div>
    <div className="product-table overflow-hidden rounded-xl border border-white/[.07] bg-[#111824]/90"><div className="overflow-x-auto"><table className="w-full min-w-[860px] text-left"><thead className="bg-white/[.03]"><tr className="mono text-[10px] uppercase tracking-[.1em] text-[#81938d]"><th className="px-5 py-4">Producto</th><th className="px-4 py-4">Marca</th><th className="px-4 py-4">Categoría</th><th className="px-4 py-4">Precio</th><th className="px-4 py-4">Estado</th><th className="px-4 py-4">Origen</th></tr></thead><tbody>{filtered.map((product) => <tr key={product.id} className="border-t border-white/[.06] text-sm hover:bg-white/[.025]"><td className="max-w-xs px-5 py-3"><div className="flex items-center gap-3"><ProductImage product={product} /><span className="truncate text-[#e8f0ec]">{product.name}</span></div></td><td className="px-4 py-3 text-[#a9b8b4]">{product.brand}</td><td className="px-4 py-3 text-[#a9b8b4]">{product.category}</td><td className="mono px-4 py-3 text-[#4cd7f6]">{product.price === null ? 'Sin precio' : `$${product.price.toFixed(2)}`}</td><td className="px-4 py-3"><ProductStatus available={product.available} /></td><td className="px-4 py-3"><ProductOrigin product={product} /></td></tr>)}</tbody></table></div></div>
  </div>
}

export default ProductsPage
