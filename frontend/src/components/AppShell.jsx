import { Database, GitBranch, LayoutDashboard, Boxes } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/products', label: 'Productos', icon: Boxes },
  { to: '/pipeline', label: 'Pipeline', icon: GitBranch },
]

function AppShell({ children }) {
  return <div className="grid-noise min-h-screen bg-[#090d16] text-[#dfe7e3]">
    <header className="sticky top-0 z-20 border-b border-white/[.07] bg-[#090d16]/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-3 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#4edea3] text-[#06251b]"><Database size={18} /></div>
          <div><p className="text-sm font-bold tracking-tight">Bebidas<span className="text-[#4edea3]">Data</span></p><p className="mono text-[9px] uppercase tracking-[.18em] text-[#7d918b]">Scraping analytics</p></div>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex items-center gap-2 rounded-md px-3 py-2 text-sm transition ${isActive ? 'bg-[#4edea3]/12 text-[#4edea3]' : 'text-[#8b9b98] hover:bg-white/5 hover:text-white'}`}><Icon size={15} />{label}</NavLink>)}
        </nav>
        <span className="mono hidden items-center gap-2 text-[10px] uppercase tracking-wider text-[#4edea3] sm:flex"><span className="h-2 w-2 animate-pulse rounded-full bg-[#4edea3]" /> API online</span>
      </div>
      <nav className="flex border-t border-white/[.05] px-3 py-2 md:hidden">
        {navItems.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex flex-1 flex-col items-center gap-1 py-1 text-[10px] ${isActive ? 'text-[#4edea3]' : 'text-[#7d918b]'}`}><Icon size={17} />{label}</NavLink>)}
      </nav>
    </header>
    <main className="mx-auto max-w-[1440px] px-4 py-6 lg:px-8">{children}</main>
    <footer className="mx-auto flex max-w-[1440px] flex-col gap-2 border-t border-white/[.07] px-4 py-5 text-xs text-[#687b76] sm:flex-row sm:items-center sm:justify-between lg:px-8"><span>Bebidas Data · catálogo scrapeado para análisis</span><span className="mono">Node.js · Axios · Cheerio · Express · SQLite · React</span></footer>
  </div>
}

export default AppShell
