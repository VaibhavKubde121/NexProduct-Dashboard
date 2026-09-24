import { useEffect, useState } from 'react'
import { getProduct } from '../api/products.js'

function readLocalProduct(id) {
  try {
    const overrides = JSON.parse(localStorage.getItem('admin-product-overrides') || '{}')
    if ([...(overrides.deleted || []), ...(overrides.deletedApiIds || [])].some((deletedId) => String(deletedId) === String(id))) return null
    const local = overrides.created?.find((product) => String(product._apiId ?? product.id) === String(id))
    if (local) return { ...local, ...(overrides.updated?.[local.id] || {}) }
    return overrides.updated?.[id] || null
  } catch { return null }
}

function formatDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
}

export default function ProductDetailsPage({ id, onLogout }) {
  const [product, setProduct] = useState(null)
  const [selectedImage, setSelectedImage] = useState('')
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState('')
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true); setNotFound(false); setError(''); setProduct(null)
    const localProduct = readLocalProduct(id)
    const request = localProduct ? Promise.resolve(localProduct) : getProduct(id)
    request.then((result) => {
      if (!active) return
      setProduct(result)
      setNotFound(!result)
      setSelectedImage(result?.images?.[0] || result?.thumbnail || '')
    }).catch((requestError) => {
      if (!active) return
      if (requestError.response?.status === 404) setNotFound(true)
      else setError(requestError.message || 'Could not load this product.')
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id, retryKey])

  const images = product ? [...new Set([...(product.images || []), product.thumbnail].filter(Boolean))] : []

  return <div className="app-shell">
    <aside className="sidebar"><a className="brand" href="/products"><img className="brand-logo" src="/nexproduct-logo.svg" alt="NexProduct" /></a>
      <div className="workspace-label">WORKSPACE</div><nav><a className="nav-link active" href="/products"><span className="nav-icon">▦</span>Products</a></nav>
      <div className="sidebar-bottom"><div className="sidebar-user"><span className="admin-avatar" aria-hidden="true">A</span><div><strong>ADMIN</strong><span>Administrator</span></div></div></div>
    </aside>
    <main className="main-content"><header className="topbar"><div className="breadcrumb"><a href="/products">Products</a><span>/</span><strong>Product details</strong></div><div className="topbar-right"><button className="top-logout" onClick={onLogout}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 17l5-5-5-5M15 12H3"/><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/></svg><span>Log out</span></button></div></header>
      <div className="page-content product-detail-content"><a className="detail-back" href="/products"><span aria-hidden="true">←</span> Back to products</a>
        {loading ? <div className="loading-state"><span className="spinner" /> Loading product…</div> : notFound ? <section className="product-not-found"><span>404</span><h1>Product not found</h1><p>We couldn’t find a product with ID “{id}”.</p><a className="primary-button" href="/products">Return to products</a></section> : error ? <div className="inline-error" role="alert"><span>!</span><span className="error-message">{error}</span><button type="button" className="error-retry" onClick={() => setRetryKey((key) => key + 1)}>Retry</button></div> : product && <>
          <div className="product-detail-heading"><div><span className="eyebrow">PRODUCT DETAILS</span><h1>{product.title}</h1><span className="category-pill">{(product.category || 'uncategorized').replaceAll('-', ' ')}</span></div><span className="detail-sku">SKU-{String(product.id).padStart(5, '0')}</span></div>
          <section className="product-detail-grid"><div className="detail-gallery"><div className="detail-hero-image">{selectedImage ? <img src={selectedImage} alt={product.title} /> : <span>No image available</span>}</div>{images.length > 1 && <div className="detail-thumbnails" aria-label="Product images">{images.map((image, index) => <button key={image} type="button" className={selectedImage === image ? 'selected' : ''} onClick={() => setSelectedImage(image)} aria-label={`View image ${index + 1}`}><img src={image} alt="" /></button>)}</div>}</div>
            <div className="product-detail-info"><span className="eyebrow">PRICE</span><strong className="detail-price">${Number(product.price || 0).toFixed(2)}</strong>{product.discountPercentage > 0 && <span className="detail-discount">{Number(product.discountPercentage).toFixed(1)}% off</span>}<div className="detail-rating"><span aria-hidden="true">★</span> {Number(product.rating || 0).toFixed(1)} <span className="detail-stock">· {product.stock ?? 0} in stock</span></div><div className="detail-description"><h2>Description</h2><p>{product.description || 'No description is available for this product.'}</p></div><dl className="detail-meta"><div><dt>Brand</dt><dd>{product.brand || '—'}</dd></div><div><dt>Category</dt><dd>{(product.category || '—').replaceAll('-', ' ')}</dd></div><div><dt>SKU</dt><dd>{String(product.id).padStart(5, '0')}</dd></div></dl></div>
          </section>
          <section className="reviews-section"><div className="reviews-heading"><div><span className="eyebrow">CUSTOMER FEEDBACK</span><h2>Reviews</h2></div><span>{product.reviews?.length || 0} reviews</span></div>{product.reviews?.length ? <div className={`reviews-grid${product.reviews.length > 3 ? ' reviews-scrollable' : ''}`}>{product.reviews.map((review, index) => <article className="review-card" key={`${review.reviewerEmail || review.reviewerName}-${index}`}><div className="review-card-heading"><strong>{review.reviewerName || 'Customer'}</strong><span className="review-rating">★ {Number(review.rating || 0).toFixed(1)}</span></div><p>{review.comment}</p><time>{formatDate(review.date)}</time></article>)}</div> : <p className="reviews-empty">No reviews yet.</p>}</section>
        </>}
      </div>
    </main>
  </div>
}
