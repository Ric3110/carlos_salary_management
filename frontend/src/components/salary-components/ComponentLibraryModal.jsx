import { useEffect, useRef, useState } from 'react'

export default function ComponentLibraryModal({
  components,
  saving,
  error,
  onClearError,
  onClose,
  onCreate,
  onRename,
  onDelete,
}) {
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [localError, setLocalError] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    inputRef.current?.focus()
    return () => {
      document.body.style.overflow = previousOverflow
      if (previousFocus?.isConnected) previousFocus.focus()
    }
  }, [])

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape' && !saving) onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [saving, onClose])

  function validateName(name) {
    const trimmed = name.trim()
    if (!trimmed || trimmed.length > 100) {
      setLocalError('Enter a name with up to 100 characters.')
      return null
    }
    setLocalError('')
    return trimmed
  }

  async function create(event) {
    event.preventDefault()
    if (saving) return
    const name = validateName(newName)
    if (!name) return
    if (await onCreate(name)) setNewName('')
  }

  async function rename(event, component) {
    event.preventDefault()
    if (saving) return
    const name = validateName(editingName)
    if (!name) return
    if (await onRename(component, name)) {
      setEditingId(null)
      setEditingName('')
    }
  }

  function beginRename(component) {
    if (saving) return
    setEditingId(component.salary_component_id)
    setEditingName(component.name)
    setLocalError('')
    onClearError()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/35 p-4"
      onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose() }}
    >
      <section role="dialog" aria-modal="true" aria-labelledby="components-library-title" className="flex max-h-[min(680px,calc(100dvh-32px))] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-5 sm:px-6">
          <h2 id="components-library-title" className="text-xl font-semibold tracking-tight text-zinc-950">Manage components</h2>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Close" className="rounded-md px-2 py-1 text-xl leading-none text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-40">×</button>
        </div>

        <div className="border-b border-zinc-100 px-5 py-4 sm:px-6">
          <form onSubmit={create} className="flex gap-2">
            <label htmlFor="new-component-name" className="sr-only">New component name</label>
            <input
              ref={inputRef}
              id="new-component-name"
              value={newName}
              maxLength={100}
              onChange={(event) => { setNewName(event.target.value); setLocalError(''); onClearError() }}
              placeholder="New component name"
              disabled={saving}
              className="h-10 min-w-0 flex-1 rounded-lg border border-zinc-200 px-3 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-600 disabled:opacity-50"
            />
            <button type="submit" disabled={saving} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-40">Add</button>
          </form>
          {(localError || error) && <p role="alert" className="mt-2 text-sm text-red-600">{localError || error}</p>}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-2 sm:px-6">
          {components.length === 0 ? (
            <p className="py-12 text-center text-sm text-zinc-400">No components yet.</p>
          ) : components.map((component) => (
            <div key={component.salary_component_id} className="border-b border-zinc-100 py-3 last:border-b-0">
              {editingId === component.salary_component_id ? (
                <form onSubmit={(event) => rename(event, component)} className="flex flex-wrap items-center gap-2">
                  <label htmlFor={`rename-component-${component.salary_component_id}`} className="sr-only">Rename {component.name}</label>
                  <input
                    id={`rename-component-${component.salary_component_id}`}
                    autoFocus
                    value={editingName}
                    maxLength={100}
                    onChange={(event) => { setEditingName(event.target.value); setLocalError(''); onClearError() }}
                    disabled={saving}
                    className="h-9 min-w-[140px] flex-1 rounded-lg border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-600 disabled:opacity-50"
                  />
                  <button type="submit" disabled={saving} className="rounded-md px-2 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100 disabled:opacity-40">Save</button>
                  <button type="button" disabled={saving} onClick={() => { setEditingId(null); setLocalError(''); onClearError() }} className="rounded-md px-2 py-2 text-sm text-zinc-500 hover:bg-zinc-100 disabled:opacity-40">Cancel</button>
                </form>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <span className="min-w-0 break-words text-sm font-medium text-zinc-900">{component.name}</span>
                  <div className="flex shrink-0 items-center gap-1">
                    <button type="button" disabled={saving} onClick={() => beginRename(component)} className="rounded-md px-2 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 disabled:opacity-40">Rename</button>
                    <button type="button" disabled={saving} onClick={() => onDelete(component)} className="rounded-md px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-40">Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
