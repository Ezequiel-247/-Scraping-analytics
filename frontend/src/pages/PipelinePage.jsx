import { useEffect, useState } from 'react'
import { CheckCircle2, CircleAlert, ChevronRight, Database, ExternalLink, LayoutDashboard, Server, ShieldCheck, TerminalSquare } from 'lucide-react'
import { getHealth } from '../api/client'
import { Panel } from '../components/DataPanel'

const professionalLinks = [
  { label: 'Portfolio', href: 'https://portfolio-ezequiel-qzz0.onrender.com/', icon: ExternalLink },
  { label: 'GitHub', href: 'https://github.com/Ezequiel-247', icon: ExternalLink },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/eduardo-ezequiel-ortiz-7815a526b/', icon: ExternalLink },
]

function PipelinePage() {
  const [health, setHealth] = useState(null)
  useEffect(() => { getHealth().then(setHealth).catch(() => setHealth({ ok: false })) }, [])

  const steps = [
    { icon: TerminalSquare, title: 'Scraper Node.js', detail: 'Axios + Cheerio extraen y normalizan datos de bebidas.', tone: 'text-[#4edea3]' },
    { icon: Database, title: 'Seed SQLite', detail: 'SQLite persiste los registros normalizados obtenidos del scraping.', tone: 'text-[#4cd7f6]' },
    { icon: Server, title: 'Express REST API', detail: 'Expone productos, filtros, estadísticas y health check con CORS restringido.', tone: 'text-[#ffb95f]' },
    { icon: LayoutDashboard, title: 'Dashboard React', detail: 'Consume los endpoints y convierte el catálogo en una herramienta de análisis.', tone: 'text-[#c084fc]' },
  ]

  return <div className="space-y-6">
    <section className="rounded-xl border border-white/[.07] bg-[#111824]/90 p-6"><p className="mono text-[10px] uppercase tracking-[.15em] text-[#4edea3]">Engineering overview</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Arquitectura del proyecto</h1><p className="mt-2 max-w-2xl text-sm text-[#91a19d]">Una vista honesta del recorrido de los datos, desde el scraping hasta la interfaz de análisis.</p></section>
    <section className="grid gap-3 lg:grid-cols-4">{steps.map(({ icon: Icon, title, detail, tone }, index) => <div key={title} className="relative rounded-xl border border-white/[.07] bg-[#111824]/90 p-5"><div className="mb-5 flex items-center justify-between"><div className={`grid h-10 w-10 place-items-center rounded-lg bg-white/[.05] ${tone}`}><Icon size={19} /></div><span className="mono text-xs text-[#667873]">0{index + 1}</span></div><h2 className="font-semibold text-white">{title}</h2><p className="mt-2 text-sm leading-6 text-[#91a19d]">{detail}</p>{index < steps.length - 1 && <ChevronRight className="absolute -right-4 top-1/2 hidden text-[#4edea3]/50 lg:block" size={20} />}</div>)}</section>
    <section className="grid gap-5 lg:grid-cols-3">
      <Panel title="Estado del backend" eyebrow="Health check real" icon={ShieldCheck}>
        <div className="flex items-center gap-3 rounded-lg border border-white/[.07] bg-[#0b111b] p-4">{health?.ok ? <CheckCircle2 className="text-[#4edea3]" size={20} /> : <CircleAlert className="text-[#ffb95f]" size={20} />}<div><p className="font-semibold text-white">{health?.ok ? 'API disponible' : 'API no disponible'}</p><p className="mono mt-1 text-xs text-[#81938d]">GET /api/health</p></div></div></Panel>
      <Panel title="Stack utilizado" eyebrow="Implementación real" icon={TerminalSquare}><div className="flex flex-wrap gap-2">{['JavaScript', 'Node.js', 'Axios', 'Cheerio', 'Express', 'SQLite', 'React', 'Tailwind'].map((item) => <span key={item} className="rounded-md border border-[#4edea3]/20 bg-[#4edea3]/[.07] px-2.5 py-1.5 text-xs text-[#a9e8c9]">{item}</span>)}</div></Panel>
      <Panel title="Más sobre mi perfil profesional" eyebrow="Perfil profesional" icon={ExternalLink}><p className="mb-4 text-sm leading-5 text-[#91a19d]">Si te interesa conocer más sobre mis trabajos y mi experiencia, podés visitar mi portfolio y mis redes profesionales.</p><div className="space-y-2">{professionalLinks.map(({ label, href, icon: Icon }) => <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between rounded-lg border border-white/[.07] bg-[#0b111b] px-3 py-2.5 text-sm text-[#c4d0cc] transition hover:border-[#4edea3]/40 hover:text-[#4edea3]"><span className="flex items-center gap-2"><Icon size={15} />{label}</span><ExternalLink size={13} /></a>)}</div></Panel>
    </section>
  </div>
}

export default PipelinePage
