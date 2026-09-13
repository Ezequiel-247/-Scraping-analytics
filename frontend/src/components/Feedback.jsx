import { CircleAlert, LoaderCircle } from 'lucide-react'

export function LoadingState() {
  return <div className="flex min-h-64 items-center justify-center text-[#8b9b98]"><LoaderCircle className="mr-2 animate-spin" size={18} />Cargando datos de SQLite...</div>
}

export function ErrorState({ message }) {
  return <div className="rounded-xl border border-[#f59e0b]/30 bg-[#f59e0b]/10 p-5 text-sm text-[#ffcc80]"><div className="mb-1 flex items-center gap-2 font-semibold"><CircleAlert size={17} />No se pudo cargar la API</div><p className="text-[#d9b882]">{message}. Verificá que el backend esté corriendo en el puerto 3000.</p></div>
}
