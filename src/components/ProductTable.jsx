function initials(title = '') { return title.split(' ').slice(0, 2).map((word) => word[0]).join('').toUpperCase() }

function ProductImage({ product }) {
  return <div className="product-image">{product.thumbnail ? <img src={product.thumbnail} alt={`${product.title} product`} loading="lazy" /> : <span>{initials(product.title)}</span>}</div>
}

function ProductActions({ product, onEdit, onDelete, busyId }) {
  return <div className="row-actions"><button className="icon-button" aria-label={`Edit ${product.title}`} onClick={() => onEdit(product)}>✎</button><button className="icon-button delete-action" aria-label={`Delete ${product.title}`} disabled={busyId === product.id} onClick={() => onDelete(product)}><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3.5 5.5h13M8 5.5V3.8h4v1.7m3.5 0-.8 10.2H5.3L4.5 5.5m3.2 3v4.7m4.6-4.7v4.7" /></svg></button></div>
}

function ProductTitle({ product }) {
  return <a className="product-detail-link" href={`/products/${encodeURIComponent(product._apiId ?? product.id)}`}>{product.title}</a>
}

export default function ProductTable({ products, onEdit, onDelete, busyId }) {
  return <div className="table-wrap">
    <table className="desktop-product-table"><thead><tr><th>PRODUCT</th><th>CATEGORY</th><th>PRICE</th><th>RATING</th><th>STOCK</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{products.map((product) => <tr key={product.id}>
      <td><div className="product-cell"><ProductImage product={product} /><div className="product-name"><strong><ProductTitle product={product} /></strong><span>SKU-{String(product.id).padStart(5, '0')}</span></div></div></td>
      <td><span className="category-pill">{(product.category || 'uncategorized').replaceAll('-', ' ')}</span></td><td className="price-cell">${Number(product.price || 0).toFixed(2)}</td>
      <td><span className="product-rating"><span aria-hidden="true">★</span> {Number(product.rating || 0).toFixed(1)}</span></td>
      <td><span className={`stock-status ${(product.stock || 0) < 10 ? 'low-stock' : ''}`}><i />{product.stock ?? 0} units</span></td>
      <td><ProductActions product={product} onEdit={onEdit} onDelete={onDelete} busyId={busyId} /></td>
    </tr>)}</tbody></table>
    <div className="product-cards">{products.map((product) => <article className="product-card" key={product.id}>
      <div className="product-card-heading"><ProductImage product={product} /><div className="product-name"><strong><ProductTitle product={product} /></strong><span>SKU-{String(product.id).padStart(5, '0')}</span></div><ProductActions product={product} onEdit={onEdit} onDelete={onDelete} busyId={busyId} /></div>
      <div className="product-card-details"><div><span>Category</span><strong className="category-pill">{(product.category || 'uncategorized').replaceAll('-', ' ')}</strong></div><div><span>Price</span><strong className="price-cell">${Number(product.price || 0).toFixed(2)}</strong></div><div><span>Rating</span><strong className="product-rating"><span aria-hidden="true">★</span> {Number(product.rating || 0).toFixed(1)}</strong></div><div><span>Stock</span><strong className={`stock-status ${(product.stock || 0) < 10 ? 'low-stock' : ''}`}><i />{product.stock ?? 0} units</strong></div></div>
    </article>)}</div>
    {!products.length && <div className="empty-state"><div>⌕</div><h3>No products found</h3><p>Try a different search or clear your filters.</p></div>}
  </div>
}
