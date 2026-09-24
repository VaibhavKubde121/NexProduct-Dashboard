import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { addProduct, deleteProduct, getCategories, getProducts, updateProduct } from '../api/products.js'
import ProductModal from './ProductModal.jsx'
import ProductTable from './ProductTable.jsx'
import FilterDropdown from './FilterDropdown.jsx'
import DeleteConfirmModal from './DeleteConfirmModal.jsx'

const PAGE_SIZES = [10, 20, 50]
const SORT_KEYS = ['title', 'price', 'rating']
function readQuery() {
  const params = new URLSearchParams(window.location.search)
  const page = Number(params.get('page'))
  const pageSize = Number(params.get('pageSize'))
  return {
    page: Number.isInteger(page) && page > 0 ? page : 1,
    pageSize: PAGE_SIZES.includes(pageSize) ? pageSize : 10,
    search: params.get('search') || '', category: params.get('category') || '',
    sort: SORT_KEYS.includes(params.get('sort')) ? params.get('sort') : 'title',
    order: params.get('order') === 'desc' ? 'desc' : 'asc',
    delay: /^\d+$/.test(params.get('delay') || '') ? Math.min(Number(params.get('delay')), 10000) : 0,
  }
}
function useQueryState() {
  const [query, setQuery] = useState(readQuery)
  useEffect(() => {
    const pop = () => setQuery(readQuery())
    window.addEventListener('popstate', pop)
    return () => window.removeEventListener('popstate', pop)
  }, [])
  const update = useCallback((next) => {
    setQuery((current) => {
      const value = { ...current, ...next }
      const params = new URLSearchParams()
      if (value.page > 1) params.set('page', String(value.page))
      if (value.pageSize !== 10) params.set('pageSize', String(value.pageSize))
      if (value.search) params.set('search', value.search)
      if (value.category) params.set('category', value.category)
      if (value.sort !== 'title') params.set('sort', value.sort)
      if (value.order !== 'asc') params.set('order', value.order)
      if (value.delay) params.set('delay', String(value.delay))
      window.history.replaceState({}, '', `${location.pathname}${params.size ? `?${params}` : ''}`)
      return value
    })
  }, [])
  useEffect(() => { update({}) }, [])
  return [query, update]
}
function readOverlay() {
  try {
    const saved = JSON.parse(localStorage.getItem('admin-product-overrides') || '{}')
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) throw new Error('Invalid saved product data')
    return {
      created: Array.isArray(saved.created) ? saved.created : [],
      updated: saved.updated && typeof saved.updated === 'object' && !Array.isArray(saved.updated) ? saved.updated : {},
      deleted: Array.isArray(saved.deleted) ? saved.deleted : [],
      deletedApiIds: Array.isArray(saved.deletedApiIds) ? saved.deletedApiIds : [],
    }
  }
  catch { return { created: [], updated: {}, deleted: [], deletedApiIds: [] } }
}

export default function ProductPage({ user, onLogout }) {
  const [query, setQuery] = useQueryState()
  const [searchText, setSearchText] = useState(query.search)
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [apiTotal, setApiTotal] = useState(0)
  const [overlay, setOverlay] = useState(readOverlay)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryKey, setRetryKey] = useState(0)
  const [modal, setModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const mutationLock = useRef(false)
  const requestId = useRef(0)

  useEffect(() => { setSearchText(query.search) }, [query.search])
  useEffect(() => {
    const search = searchText.trim()
    if (search === query.search) return
    const timer = window.setTimeout(() => setQuery({ search, page: 1 }), 350)
    return () => window.clearTimeout(timer)
  }, [searchText, query.search, setQuery])

  useEffect(() => { getCategories().then(setCategories).catch((e) => setError(e.message || 'Could not load categories.')) }, [retryKey])
  useLayoutEffect(() => {
    const id = ++requestId.current
    setLoading(true); setError('')
    getProducts(query).then((result) => {
      if (id === requestId.current) { setProducts(result.products); setApiTotal(result.total) }
    })
      .catch((e) => { if (id === requestId.current) setError(e.message || 'Could not load products.') })
      .finally(() => { if (id === requestId.current) setLoading(false) })
    return () => { requestId.current += 1 }
  }, [query.search, query.category, query.delay, query.page, query.pageSize, query.sort, query.order, retryKey])

  const allProducts = useMemo(() => {
    const byId = new Map(products.map((product) => [product.id, { ...product, ...(overlay.updated[product.id] || {}) }]))
    const search = query.search.trim().toLowerCase()
    const matchesFilters = (product) => (!query.category || product.category === query.category)
      && (!search || product.title?.toLowerCase().includes(search) || product.description?.toLowerCase().includes(search))
    const matchingCreated = overlay.created
      .map((product) => ({ ...product, ...(overlay.updated[product.id] || {}) }))
      .filter(matchesFilters)
    if (query.page === 1) for (const product of matchingCreated) byId.set(product.id, product)
    const deletedIds = new Set([...(overlay.deleted || []), ...(overlay.deletedApiIds || [])].map(String))
    return [...byId.values()].filter((product) => !deletedIds.has(String(product.id)))
  }, [products, overlay, query.page, query.search, query.category])
  const search = query.search.trim().toLowerCase()
  const matchingCreatedCount = overlay.created.filter((product) => {
    const current = { ...product, ...(overlay.updated[product.id] || {}) }
    return (!query.category || current.category === query.category)
      && (!search || current.title?.toLowerCase().includes(search) || current.description?.toLowerCase().includes(search))
  }).length
  const total = Math.max(0, apiTotal + matchingCreatedCount - overlay.deleted.filter((id) => !String(id).startsWith('local-')).length)
  const pages = Math.max(1, Math.ceil(total / query.pageSize))
  const page = Math.min(query.page, pages)
  const visible = allProducts.slice((page - 1) * query.pageSize, page * query.pageSize)
  useEffect(() => { if (page !== query.page) setQuery({ page }) }, [page, query.page, setQuery])

  function persist(next) {
    localStorage.setItem('admin-product-overrides', JSON.stringify(next))
    setOverlay(next)
  }
  async function saveProduct(form) {
    if (mutationLock.current) return
    mutationLock.current = true; setSaving(true)
    try {
      if (modal.product) {
        if (String(modal.product.id).startsWith('local-')) {
          const updated = { ...modal.product, ...form }
          persist({ ...overlay, created: overlay.created.map((item) => item.id === updated.id ? updated : item) })
        } else {
          const saved = await updateProduct(modal.product._apiId ?? modal.product.id, form)
          const updated = { ...form, ...saved, id: modal.product.id, _apiId: modal.product._apiId }
          persist({ ...overlay, updated: { ...overlay.updated, [updated.id]: updated } })
        }
      } else {
        const saved = await addProduct(form)
        const created = { ...form, ...saved, id: `local-${Date.now()}`, _apiId: saved.id }
        persist({ ...overlay, created: [created, ...overlay.created] })
        setQuery({ page: 1 })
      }
      setModal(null)
    } catch (e) { setError(e.message) }
    finally { mutationLock.current = false; setSaving(false) }
  }
  function removeProduct(product) {
    if (!mutationLock.current) setDeleteTarget(product)
  }
  async function confirmDelete() {
    const product = deleteTarget
    if (!product || mutationLock.current) return
    mutationLock.current = true; setBusyId(product.id)
    try {
      const isLocalProduct = String(product.id).startsWith('local-')
      if (!isLocalProduct) await deleteProduct(product._apiId ?? product.id)
      persist({
        ...overlay,
        created: overlay.created.filter((item) => item.id !== product.id),
        deleted: isLocalProduct ? overlay.deleted : [...new Set([...overlay.deleted, product.id])],
        deletedApiIds: isLocalProduct && product._apiId != null ? [...new Set([...(overlay.deletedApiIds || []), product._apiId])] : (overlay.deletedApiIds || []),
      })
      setDeleteTarget(null)
    } catch (e) { setError(e.message); setDeleteTarget(null) }
    finally { mutationLock.current = false; setBusyId(null) }
  }
  const first = total ? (page - 1) * query.pageSize + 1 : 0
  const last = total ? Math.min(first + visible.length - 1, total) : 0
  const pageNumbers = Array.from({ length: pages }, (_, index) => index + 1)
    .filter((number) => number === 1 || number === pages || Math.abs(number - page) <= 1)
  const paginationItems = pageNumbers.flatMap((number, index) => index && number - pageNumbers[index - 1] > 1
    ? [`ellipsis-${number}`, number] : [number])

  return <div className="app-shell">
    <aside className="sidebar"><a className="brand" href="/products" onClick={(e) => e.preventDefault()}><img className="brand-logo" src="/nexproduct-logo.svg" alt="NexProduct" /></a>
      <div className="workspace-label">WORKSPACE</div><nav><a className="nav-link active" href="#products"><span className="nav-icon"><svg viewBox="0 0 20 20" aria-hidden="true"><rect x="3" y="3" width="5" height="5" rx="1"/><rect x="12" y="3" width="5" height="5" rx="1"/><rect x="3" y="12" width="5" height="5" rx="1"/><rect x="12" y="12" width="5" height="5" rx="1"/></svg></span>Products<span className="nav-count">{total}</span></a></nav>
      <div className="sidebar-bottom"><div className="help-card"><span className="help-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 2.1 7.9L22 12l-7.9 2.1L12 22l-2.1-7.9L2 12l7.9-2.1L12 2Z"/></svg></span><strong>Need a hand?</strong><p>Find your way around your catalog.</p><a href="https://dummyjson.com/docs/products" target="_blank" rel="noreferrer"><svg className="docs-link-icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M5 2.75h6l4 4v10.5H5z"/><path d="M11 2.75v4h4M8 11h4M8 14h4"/></svg><span>View product docs</span></a></div><div className="sidebar-user"><span className="admin-avatar" aria-hidden="true">A</span><div><strong>ADMIN</strong><span>Administrator</span></div></div></div>
    </aside>
    <main className="main-content"><header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <strong>Products</strong></div><div className="topbar-right"><span className="status-label"><i /> Sample data</span><button className="top-logout" onClick={onLogout}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 17l5-5-5-5M15 12H3"/><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/></svg><span>Log out</span></button></div></header>
      <div className="page-content"><div className="page-heading"><div><span className="eyebrow">CATALOG MANAGEMENT</span><h1>Products</h1><p>Manage and organize your product inventory.</p></div><button className="primary-button add-button" onClick={() => setModal({ product: null })}><span className="add-icon" aria-hidden="true"><svg viewBox="0 0 16 16"><path d="M8 3v10M3 8h10"/></svg></span> Add product</button></div>
        <div className="metrics-grid">
          <div className="metric-card"><div className="metric-top"><span>Total products</span><span className="metric-symbol violet"><svg viewBox="0 0 20 20" aria-hidden="true"><rect x="3" y="3" width="14" height="14" rx="2"/><path d="M7 7h6M7 10h6M7 13h3"/></svg></span></div><strong>{loading ? '-' : total.toLocaleString()}</strong><span className="metric-caption">In your catalog</span></div>
          <div className="metric-card"><div className="metric-top"><span>Categories</span><span className="metric-symbol blue"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 6h5l2 2h7v8H3z"/><path d="M3 8h14"/></svg></span></div><strong>{categories.length || 0}</strong><span className="metric-caption">Product groups</span></div>
          <div className="metric-card"><div className="metric-top"><span>Low stock</span><span className="metric-symbol amber"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3 18 17H2L10 3Z"/><path d="M10 8v4m0 2v.1"/></svg></span></div><strong>{loading ? '-' : visible.filter((product) => (product.stock || 0) < 10).length}</strong><span className="metric-caption">On this page</span></div>
          <div className="metric-card"><div className="metric-top"><span>Avg. price</span><span className="metric-symbol green"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M13.5 6.5c-.7-.8-1.8-1.2-3.3-1.2-1.8 0-3 .8-3 2s1.2 1.9 3.2 2.3c2 .4 3.1 1.1 3.1 2.4s-1.2 2.3-3.2 2.3c-1.6 0-2.9-.5-3.8-1.5M10 3.5v13"/></svg></span></div><strong>{loading || !visible.length ? '-' : `$${(visible.reduce((sum, product) => sum + Number(product.price || 0), 0) / visible.length).toFixed(2)}`}</strong><span className="metric-caption">Across this page</span></div>
        </div>
        <section className="catalog-card"><div className="catalog-heading"><div><h2>All products</h2><p>Browse, search, and manage your inventory.</p></div><div className="catalog-count"><span className="count-dot" /> {total} products</div></div>
          <div className="toolbar"><label className="search-field"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.8" cy="8.8" r="5.8"/><path d="m13.2 13.2 4 4"/></svg><input value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Search products..." aria-label="Search products" />{searchText && <button type="button" onClick={() => setSearchText('')} aria-label="Clear search"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 4 8 8m0-8-8 8"/></svg></button>}</label>
            <FilterDropdown label="Category" value={query.category} options={[{ value: '', label: 'All categories' }, ...categories.map((category) => ({ value: category, label: category.replaceAll('-', ' ') }))]} onChange={(category) => setQuery({ category, page: 1 })} />
            <FilterDropdown label="Sort" className="sort-dropdown" value={query.sort} options={[{ value: 'title', label: 'Title' }, { value: 'price', label: 'Price' }, { value: 'rating', label: 'Rating' }]} onChange={(sort) => setQuery({ sort, order: 'asc', page: 1 })} /><button className="order-button" onClick={() => setQuery({ order: query.order === 'asc' ? 'desc' : 'asc', page: 1 })} aria-label={`Sort ${query.order === 'asc' ? 'descending' : 'ascending'}`}><svg className="sort-direction-icon" viewBox="0 0 16 16" aria-hidden="true"><path d={query.order === 'asc' ? 'm4 10 4-4 4 4' : 'm4 6 4 4 4-4'} /></svg></button>
          </div>
          {query.search && query.category && <p className="filter-note">Search is matched within the selected category.</p>}
          {error && <div className="inline-error" role="alert"><span>!</span><span className="error-message">{error}</span><button type="button" className="error-retry" onClick={() => { setError(''); setRetryKey((key) => key + 1) }}>Retry</button><button type="button" onClick={() => setError('')} aria-label="Dismiss"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 4 8 8m0-8-8 8"/></svg></button></div>}
          {loading ? <div className="loading-state"><span className="spinner" /> Loading productsâ€¦</div> : <ProductTable products={visible} onEdit={(product) => setModal({ product })} onDelete={removeProduct} busyId={busyId} />}
          <div className="table-footer"><span>Showing <strong>{first}&ndash;{last}</strong> of <strong>{total}</strong></span><div className="pagination"><label className="page-size-control">Rows<select aria-label="Rows per page" value={query.pageSize} onChange={(event) => setQuery({ pageSize: Number(event.target.value), page: 1 })}>{PAGE_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}</select></label><button className="pagination-arrow" aria-label="Previous page" disabled={page <= 1 || loading} onClick={() => setQuery({ page: page - 1 })}><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m10 3-5 5 5 5" /></svg></button>{paginationItems.map((item) => typeof item === 'number' ? <button key={item} className={`page-number${item === page ? ' active' : ''}`} aria-label={`Page ${item}`} aria-current={item === page ? 'page' : undefined} disabled={loading} onClick={() => setQuery({ page: item })}>{item}</button> : <span className="page-ellipsis" key={item}>...</span>)}<button className="pagination-arrow" aria-label="Next page" disabled={page >= pages || loading} onClick={() => setQuery({ page: page + 1 })}><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m6 3 5 5-5 5" /></svg></button></div></div>
        </section>
      </div>
    </main>
    {modal && <ProductModal product={modal.product} categories={categories} busy={saving} onClose={() => !saving && setModal(null)} onSave={saveProduct} />}
    {deleteTarget && <DeleteConfirmModal product={deleteTarget} busy={busyId === deleteTarget.id} onCancel={() => !busyId && setDeleteTarget(null)} onConfirm={confirmDelete} />}
  </div>
}


