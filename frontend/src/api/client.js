const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

async function request(path) {
  const response = await fetch(`${API_URL}${path}`)
  if (!response.ok) throw new Error(`La API respondió con ${response.status}`)
  return response.json()
}

export const getStats = () => request('/stats')
export const getProducts = () => request('/products')
export const getHealth = () => request('/health')
