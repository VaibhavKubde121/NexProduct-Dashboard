import { useEffect, useRef } from 'react'

export default function DeleteConfirmModal({ product, busy, onCancel, onConfirm }) {
  const cancelButton = useRef(null)

  useEffect(() => {
    cancelButton.current?.focus()
    function handleKeyDown(event) {
      if (event.key === 'Escape' && !busy) onCancel()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [busy, onCancel])

  return <div className="confirm-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onCancel() }}>
    <section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-dialog-title" aria-describedby="delete-dialog-description">
      <div className="confirm-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3" /></svg></div>
      <h2 id="delete-dialog-title">Delete product?</h2>
      <p id="delete-dialog-description">Are you sure you want to delete <strong>{product.title}</strong>? This action cannot be undone.</p>
      <div className="confirm-actions"><button ref={cancelButton} type="button" className="secondary-button" onClick={onCancel} disabled={busy}>Cancel</button><button type="button" className="delete-confirm-button" onClick={onConfirm} disabled={busy}>{busy ? <><span className="spinner" /> Deleting...</> : 'Delete product'}</button></div>
    </section>
  </div>
}
