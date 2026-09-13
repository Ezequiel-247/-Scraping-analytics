import { Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import DashboardPage from './pages/DashboardPage'
import PipelinePage from './pages/PipelinePage'
import ProductsPage from './pages/ProductsPage'

function App() {
  return <AppShell><Routes><Route path="/" element={<DashboardPage />} /><Route path="/products" element={<ProductsPage />} /><Route path="/pipeline" element={<PipelinePage />} /><Route path="*" element={<DashboardPage />} /></Routes></AppShell>
}

export default App
