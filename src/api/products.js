import api from '../lib/axios.js'
export async function getCategories(params = {}) {
  const { data } = await api.get('/products/categories', { params })
  return (data || []).map((category) => typeof category === 'string' ? category : category.slug)
}
export async function getProducts({ search, category, delay, limit, skip, sort, order }) {
  // Fetch the full matching source set before applying combined filters and client-side pagination.
  // DummyJSON does not provide a combined category + search endpoint.
  const path = category ? `/products/category/${encodeURIComponent(category)}` : search ? '/products/search' : '/products'
  const { data } = await api.get(path, { params: { ...(delay ? { delay } : {}), ...(search && !category ? { q: search } : {}), limit: 0, sortBy: sort, order } })
  const term = search?.trim().toLowerCase()
  const products = (data.products || []).filter((product) =>
    (!category || product.category === category)
    && (!term || product.title?.toLowerCase().includes(term) || product.description?.toLowerCase().includes(term)),
  )
  const sorted = sort ? [...products].sort((a, b) => {
    const left = a[sort]
    const right = b[sort]
    const comparison = typeof left === 'string' ? left.localeCompare(right) : Number(left) - Number(right)
    return order === 'desc' ? -comparison : comparison
  }) : products
  return { products: sorted, total: sorted.length }
}
export async function getProduct(id) {
  const { data } = await api.get(`/products/${encodeURIComponent(id)}`)
  return data
}
export async function addProduct(product) { const { data } = await api.post('/products/add', product); return data }
export async function updateProduct(id, product) { const { data } = await api.put(`/products/${id}`, product); return data }
export async function deleteProduct(id) { const { data } = await api.delete(`/products/${id}`); return data }
