import { useEffect, useState } from 'react'
import { BarChart3, CheckCircle2 } from 'lucide-react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { getStats } from '../api/client'
import { LoadingState, ErrorState } from '../components/Feedback'
import { SummaryCards } from '../components/DashboardCards'
import { Panel, RankingList } from '../components/DataPanel'

function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => { getStats().then(setStats).catch((err) => setError(err.message)) }, [])
  if (error) return <ErrorState message={error} />
  if (!stats) return <LoadingState />

  const availability = [{ name: 'Disponibles', value: stats.availability.available }, { name: 'Agotados', value: stats.availability.unavailable }]
  const topBrands = stats.avgPriceByBrand.slice(0, 8)
  const highestBrandAverage = Math.max(...topBrands.map((item) => item.averagePrice), 1)

  return <div className="space-y-6">
    <section className="flex flex-col justify-between gap-5 rounded-xl border border-white/[.07] bg-[#111824]/90 p-6 lg:flex-row lg:items-end"><div><p className="mono mb-3 text-[10px] uppercase tracking-[.15em] text-[#4edea3]">Catálogo conectado · datos reales</p><h1 className="max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">Resumen del catálogo</h1><p className="mt-2 max-w-xl text-sm text-[#91a19d]">Datos de bebidas scrapeadas, normalizados en SQLite y expuestos a través de una API REST.</p></div><div className="mono text-xs text-[#81938d]">Generado {new Date(stats.generatedAt).toLocaleString('es-UY')}</div></section>
    <SummaryCards stats={stats} />
    <section className="grid gap-5 xl:grid-cols-[1.4fr_.8fr]">
      <Panel title="Precio promedio por marca" eyebrow="Comparativa del catálogo" icon={BarChart3}><div className="space-y-3">{topBrands.map((item) => <div key={item.brand}><div className="mb-1 flex items-center justify-between gap-3 text-xs"><span className="truncate text-[#c4d0cc]">{item.brand}</span><span className="mono shrink-0 text-[#4cd7f6]">${item.averagePrice.toFixed(2)} · {item.pricedCount} con precio</span></div><div className="h-2 overflow-hidden rounded-full bg-[#202d3a]"><div className="h-full rounded-full bg-[#4cd7f6] transition-all" style={{ width: `${(item.averagePrice / highestBrandAverage) * 100}%` }} /></div></div>)}</div></Panel>
      <Panel title="Disponibilidad" eyebrow="Estado de stock" icon={CheckCircle2}><div className="relative h-72"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={availability} dataKey="value" nameKey="name" innerRadius={70} outerRadius={98} paddingAngle={3}><Cell fill="#4edea3" /><Cell fill="#ffb95f" /></Pie><Tooltip contentStyle={{ background: '#182231', border: '1px solid #30433f', borderRadius: 8 }} /></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 grid place-items-center text-center"><div><p className="mono text-3xl font-semibold text-white">{stats.availability.availablePercent}%</p><p className="mono text-[10px] uppercase tracking-wider text-[#81938d]">disponible</p></div></div></div><div className="flex justify-center gap-5 text-xs text-[#a9b8b4]"><span><i className="mr-2 inline-block h-2 w-2 rounded-full bg-[#4edea3]" />Disponibles</span><span><i className="mr-2 inline-block h-2 w-2 rounded-full bg-[#ffb95f]" />Agotados</span></div></Panel>
    </section>
    <section className="grid gap-5 lg:grid-cols-2"><RankingList title="Más caros" items={stats.topExpensive.slice(0, 5)} tone="amber" /><RankingList title="Más económicos" items={stats.topCheapest.slice(0, 5)} tone="green" /></section>
  </div>
}

export default DashboardPage
