import { BarChart3, CheckCircle2, CircleAlert } from 'lucide-react'

export function MetricCard({ label, value, detail, tone = 'green', icon: Icon }) {
  const colors = { green: 'text-[#4edea3]', cyan: 'text-[#4cd7f6]', amber: 'text-[#ffb95f]' }
  return <article className="relative overflow-hidden rounded-xl border border-white/[.07] bg-[#111824]/90 p-5"><div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-current to-transparent ${colors[tone]}`} /><div className="mb-5 flex items-center justify-between"><span className="mono text-[10px] uppercase tracking-[.12em] text-[#81938d]">{label}</span><Icon className={colors[tone]} size={17} /></div><div className="mono text-3xl font-semibold tracking-tight text-white">{value}</div><p className="mt-2 text-xs text-[#81938d]">{detail}</p></article>
}

export function SummaryCards({ stats }) {
  const averagePrice = stats.overallAveragePrice === null ? '0.00' : stats.overallAveragePrice.toFixed(2)
  return <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Productos" value={stats.totalProducts} detail="Registros en SQLite" icon={BarChart3} /><MetricCard label="Precio promedio" value={`$${averagePrice}`} detail="Promedio SQL con precio válido" tone="cyan" icon={BarChart3} /><MetricCard label="Disponibilidad" value={`${stats.availability.availablePercent}%`} detail={`${stats.availability.available} productos disponibles`} icon={CheckCircle2} /><MetricCard label="Sin stock" value={stats.availability.unavailable} detail={`${stats.availability.unavailablePercent}% del catálogo`} tone="amber" icon={CircleAlert} /></section>
}
