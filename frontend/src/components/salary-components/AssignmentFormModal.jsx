import { useEffect, useRef, useState } from 'react'

const amountPattern = /^(0|[1-9]\d{0,9})(\.\d{1,2})?$/

function employeeName(employee) {
  return [employee.first_name, employee.middle_name, employee.last_name].filter(Boolean).join(' ')
}

export default function AssignmentFormModal({ employee, assignment, availableComponents, saving, serverError, onClose, onSave }) {
  const editing = Boolean(assignment)
  const [componentId, setComponentId] = useState('')
  const [amount, setAmount] = useState(editing ? String(assignment.amount) : '')
  const [errors, setErrors] = useState({})
  const firstField = useRef(null)

  useEffect(() => {
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    firstField.current?.focus()
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
    const nextErrors = {}
    if (!editing && !availableComponents.some((item) => String(item.salary_component_id) === componentId)) {
      nextErrors.componentId = 'Select a component.'
    }
    if (!amountPattern.test(amount.trim())) {
      nextErrors.amount = 'Enter an amount with up to two decimal places.'
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    onSave(editing
      ? { amount: amount.trim() }
      : { salary_component_id: Number(componentId), amount: amount.trim() })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/35 p-4"
      onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose() }}
    >
      <section role="dialog" aria-modal="true" aria-labelledby="assignment-modal-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl sm:p-8">
        <div className="mb-7 flex items-start justify-between gap-4">
          <div>
            <h2 id="assignment-modal-title" className="text-xl font-semibold tracking-tight text-zinc-950">
              {editing ? 'Edit amount' : 'Assign component'}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">{employeeName(employee)}</p>
          </div>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Close" className="rounded-md px-2 py-1 text-xl leading-none text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-40">×</button>
        </div>

        <form onSubmit={submit} noValidate>
          <label htmlFor="assigned-component" className="block text-sm font-medium text-zinc-800">Component</label>
          {editing ? (
            <input id="assigned-component" type="text" value={assignment.name} disabled className="mt-2 h-11 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-600" />
          ) : (
            <select
              id="assigned-component"
              ref={firstField}
              value={componentId}
              disabled={saving}
              onChange={(event) => { setComponentId(event.target.value); setErrors((current) => ({ ...current, componentId: '' })) }}
              aria-invalid={Boolean(errors.componentId)}
              aria-describedby={errors.componentId ? 'component-select-error' : undefined}
              className={`mt-2 h-11 w-full rounded-lg border bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-800 disabled:opacity-50 ${errors.componentId ? 'border-red-500' : 'border-zinc-200'}`}
            >
              <option value="">Select component</option>
              {availableComponents.map((component) => (
                <option key={component.salary_component_id} value={component.salary_component_id}>{component.name}</option>
              ))}
            </select>
          )}
          {errors.componentId && <p id="component-select-error" className="mt-1 text-xs text-red-600">{errors.componentId}</p>}

          <label htmlFor="component-amount" className="mt-5 block text-sm font-medium text-zinc-800">Monthly amount</label>
          <div className={`mt-2 flex h-11 items-center rounded-lg border bg-white focus-within:border-zinc-800 ${errors.amount ? 'border-red-500' : 'border-zinc-200'}`}>
            <span className="select-none pl-3 text-sm text-zinc-500" aria-hidden="true">₱</span>
            <input
              id="component-amount"
              ref={editing ? firstField : undefined}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={amount}
              onChange={(event) => { setAmount(event.target.value); setErrors((current) => ({ ...current, amount: '' })) }}
              placeholder="0.00"
              disabled={saving}
              required
              aria-invalid={Boolean(errors.amount)}
              aria-describedby={errors.amount ? 'component-amount-error' : undefined}
              className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 disabled:opacity-50"
            />
          </div>
          {errors.amount && <p id="component-amount-error" className="mt-1 text-xs text-red-600">{errors.amount}</p>}
          {serverError && <p role="alert" className="mt-5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</p>}
          <div className="mt-8 flex justify-end gap-3">
            <button type="button" onClick={onClose} disabled={saving} className="rounded-lg border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50">
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Assign'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
