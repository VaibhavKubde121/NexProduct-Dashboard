import { useEffect, useRef, useState } from 'react'
import FilterDropdown from './FilterDropdown.jsx'

const empty = { title: '', category: '', price: '', stock: '', description: '', thumbnail: '' }

export default function ProductModal({ product, categories, busy, onClose, onSave }) {
  const [form, setForm] = useState(product ? { title: product.title || '', category: product.category || '', price: product.price ?? '', stock: product.stock ?? '', description: product.description || '', thumbnail: product.thumbnail || '' } : empty)
  const [errors, setErrors] = useState({})
  const imageInput = useRef(null)

  useEffect(() => {
    function keydown(event) { if (event.key === 'Escape' && !busy) onClose() }
    window.addEventListener('keydown', keydown)
    return () => window.removeEventListener('keydown', keydown)
  }, [busy, onClose])

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: '' }))
  }

  function selectImage(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setErrors((current) => ({ ...current, thumbnail: 'Choose an image file.' }))
      event.target.value = ''
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrors((current) => ({ ...current, thumbnail: 'Choose an image smaller than 2 MB.' }))
      event.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      update('thumbnail', String(reader.result || ''))
    }
    reader.onerror = () => setErrors((current) => ({ ...current, thumbnail: 'The image could not be read. Try another file.' }))
    reader.readAsDataURL(file)
  }

  function submit(event) {
    event.preventDefault()
    const nextErrors = {}
    const price = Number(form.price)
    const stock = Number(form.stock)
    if (!form.title.trim()) nextErrors.title = 'Enter a product name.'
    if (!form.category) nextErrors.category = 'Choose a category.'
    if (form.price === '' || !Number.isFinite(price) || price < 0) nextErrors.price = 'Enter a valid price of 0 or more.'
    if (form.stock === '' || !Number.isInteger(stock) || stock < 0) nextErrors.stock = 'Enter a whole number of 0 or more.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    onSave({ ...form, title: form.title.trim(), price, stock, thumbnail: form.thumbnail.trim() })
  }

  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose() }}>
    <form className="product-modal" noValidate onSubmit={submit}>
      <div className="modal-heading"><div><span className="eyebrow">CATALOG</span><h2>{product ? 'Edit product' : 'Add product'}</h2></div><button type="button" className="icon-button" onClick={onClose} aria-label="Close" disabled={busy}>×</button></div>
      <label className="field-label" htmlFor="product-title">Product name</label><input id="product-title" value={form.title} onChange={(event) => update('title', event.target.value)} aria-invalid={!!errors.title} aria-describedby={errors.title ? 'product-title-error' : undefined} required />{errors.title && <p className="field-error" id="product-title-error">{errors.title}</p>}
      <div className="form-grid"><div><label className="field-label" htmlFor="product-category">Category</label><FilterDropdown id="product-category" label="Category" hideLabel className="modal-category-dropdown" value={form.category} invalid={!!errors.category} describedBy={errors.category ? 'product-category-error' : undefined} options={[{ value: '', label: 'Choose category' }, ...categories.map((category) => ({ value: category, label: category.replaceAll('-', ' ') }))]} onChange={(category) => update('category', category)} />{errors.category && <p className="field-error" id="product-category-error">{errors.category}</p>}</div><div><label className="field-label" htmlFor="product-price">Price ($)</label><input id="product-price" type="number" min="0" step="0.01" value={form.price} onChange={(event) => update('price', event.target.value)} aria-invalid={!!errors.price} aria-describedby={errors.price ? 'product-price-error' : undefined} required />{errors.price && <p className="field-error" id="product-price-error">{errors.price}</p>}</div></div>
      <div className="form-grid"><div><label className="field-label" htmlFor="product-stock">Stock</label><input id="product-stock" type="number" min="0" step="1" value={form.stock} onChange={(event) => update('stock', event.target.value)} aria-invalid={!!errors.stock} aria-describedby={errors.stock ? 'product-stock-error' : undefined} required />{errors.stock && <p className="field-error" id="product-stock-error">{errors.stock}</p>}</div><div><label className="field-label" htmlFor="product-image">Product image</label><input ref={imageInput} id="product-image" type="file" accept="image/*" onChange={selectImage} aria-invalid={!!errors.thumbnail} aria-describedby={errors.thumbnail ? 'product-image-error product-image-help' : 'product-image-help'} />{errors.thumbnail && <p className="field-error" id="product-image-error">{errors.thumbnail}</p>}<p className="image-upload-help" id="product-image-help">PNG, JPG, WebP, or other image · Max 2 MB</p>{form.thumbnail && <div className="image-upload-preview"><img src={form.thumbnail} alt="Selected product preview" /><button type="button" className="secondary-button" onClick={() => { update('thumbnail', ''); if (imageInput.current) imageInput.current.value = '' }}>Remove image</button></div>}</div></div>
      <label className="field-label" htmlFor="product-description">Description</label><textarea id="product-description" rows="3" value={form.description} onChange={(event) => update('description', event.target.value)} />
      <div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose} disabled={busy}>Cancel</button><button type="submit" className="primary-button" disabled={busy}>{busy ? <><span className="spinner" /> Saving...</> : 'Save product'}</button></div>
    </form>
  </div>
}
