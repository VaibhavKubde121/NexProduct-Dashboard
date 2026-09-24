import { useEffect, useRef, useState } from 'react'

export default function FilterDropdown({ label, value, options, onChange, className = '', hideLabel = false, id, invalid = false, describedBy }) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const root = useRef(null)
  const trigger = useRef(null)
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value))
  const selected = options[selectedIndex]

  useEffect(() => {
    function closeOutside(event) {
      if (!root.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', closeOutside)
    return () => document.removeEventListener('pointerdown', closeOutside)
  }, [])

  function selectOption(option) {
    onChange(option.value)
    setOpen(false)
    trigger.current?.focus()
  }

  function handleKeyDown(event) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) {
        setActiveIndex(selectedIndex)
        setOpen(true)
      } else {
        const direction = event.key === 'ArrowDown' ? 1 : -1
        setActiveIndex((index) => (index + direction + options.length) % options.length)
      }
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (open) selectOption(options[activeIndex])
      else { setActiveIndex(selectedIndex); setOpen(true) }
    } else if (event.key === 'Escape' && open) {
      event.preventDefault()
      setOpen(false)
    }
  }

  const menuId = `${id || label.toLowerCase()}-options`
  return <div className={`filter-dropdown ${className}${invalid ? ' invalid' : ''}`} ref={root}>
    {!hideLabel && <span className="filter-dropdown-label">{label}</span>}
    <button ref={trigger} id={id} type="button" className="filter-dropdown-trigger" role="combobox" aria-label={label} aria-invalid={invalid} aria-describedby={describedBy} aria-haspopup="listbox" aria-expanded={open} aria-controls={menuId} onClick={() => { setActiveIndex(selectedIndex); setOpen((isOpen) => !isOpen) }} onKeyDown={handleKeyDown}>
      <span className="filter-dropdown-value">{selected?.label}</span>
      <svg className={`filter-dropdown-chevron${open ? ' open' : ''}`} viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg>
    </button>
    {open && <div className="filter-dropdown-menu" id={menuId} role="listbox" aria-label={label}>
      {options.map((option, index) => <button key={option.value} type="button" role="option" aria-selected={option.value === value} className={`filter-dropdown-option${index === activeIndex ? ' active' : ''}`} onMouseEnter={() => setActiveIndex(index)} onClick={() => selectOption(option)}>{option.label}</button>)}
    </div>}
  </div>
}
