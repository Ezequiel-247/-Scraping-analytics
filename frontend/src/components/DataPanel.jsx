import { CheckCircle2, CircleAlert } from 'lucide-react'

export function Panel({ title, eyebrow, icon: Icon, children }) {
  return <article className="rounded-xl border border-white/[.07] bg-[#111824]/90 p-5"><div className="mb-4 flex items-start justify-between"><div><p className="mono text-[10px] uppercase tracking-[.13em] text-[#81938d]">{eyebrow}</p><h2 className="mt-1 text-lg font-semibold text-white">{title}</h2></div><Icon className="text-[#4edea3]" size={18} /></div>{children}</article>
}

export function RankingList({ title, items, tone }) {
  return <Panel title={title} eyebrow="Precio registrado" icon={tone === 'amber' ? CircleAlert : CheckCircle2}><div className="space-y-2">{items.map((item) => <div key={`${item.name}-${item.price}`} className="flex items-center justify-between gap-4 border-b border-white/[.06] py-2 last:border-0"><div className="min-w-0"><p className="truncate text-sm text-[#dfe7e3]">{item.name}</p><p className="text-xs text-[#81938d]">{item.brand} · {item.category}</p></div><span className={`mono shrink-0 text-sm ${tone === 'amber' ? 'text-[#ffb95f]' : 'text-[#4edea3]'}`}>${item.price.toFixed(2)}</span></div>)}</div></Panel>
}
