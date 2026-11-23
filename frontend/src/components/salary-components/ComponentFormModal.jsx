import { useEffect, useRef, useState } from 'react'

export default function ComponentFormModal({ component, saving, serverError, onClose, onSave }) {
  const editing = Boolean(component)
  const [name, setName] = useState(component?.name || '')
  const [error, setError] = useState('')
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
    function handleEscape(event) {
      if (event.key === 'Escape' && !saving) onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [saving, onClose])

  function submit(event) {
    event.preventDefault()
    if (saving) return
    const value = name.trim()
    if (!value || value.length > 100) {
      setError('Enter a name with up to 100 characters.')
      return
    }
    onSave(value)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/35 p-4"
      onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose() }}
    >
      <section role="dialog" aria-modal="true" aria-labelledby="component-modal-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl sm:p-8">
        <div className="mb-7 flex items-center justify-between gap-4">
          <h2 id="component-modal-title" className="text-xl font-semibold tracking-tight text-zinc-950">
            {editing ? 'Edit component' : 'New component'}
          </h2>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Close" className="rounded-md px-2 py-1 text-xl leading-none text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-40">×</button>
        </div>

        <form onSubmit={submit} noValidate>
          <label htmlFor="component-name" className="block text-sm font-medium text-zinc-800">Name</label>
          <input
            id="component-name"
            ref={inputRef}
            type="text"
            maxLength={100}
            value={name}
            onChange={(event) => { setName(event.target.value); setError('') }}
            placeholder="e.g. Meal allowance"
            disabled={saving}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'component-name-error' : undefined}
            className={`mt-2 h-11 w-full rounded-lg border bg-white px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-800 disabled:opacity-50 ${error ? 'border-red-500' : 'border-zinc-200'}`}
          />
          {error && <p id="component-name-error" className="mt-1 text-xs text-red-600">{error}</p>}
          {serverError && <p role="alert" className="mt-5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</p>}
          <div className="mt-8 flex justify-end gap-3">
            <button type="button" onClick={onClose} disabled={saving} className="rounded-lg border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50">
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
