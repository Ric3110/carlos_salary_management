import { useEffect, useRef, useState } from 'react'

function fullName(employee) {
  return [employee.first_name, employee.middle_name, employee.last_name].filter(Boolean).join(' ')
}

function validateAmount(value) {
  const amount = value.trim()
  if (!amount) return 'Monthly salary is required.'
  if (!/^(0|[1-9]\d{0,9})(\.\d{1,2})?$/.test(amount)) {
    return 'Enter a valid amount with up to two decimal places.'
  }
  return ''
}

export default function SalaryAssignmentModal({ employee, onClose, onSave, saving, serverError }) {
  const assigned = employee.monthly_basic_salary !== null && employee.monthly_basic_salary !== undefined
  const [amount, setAmount] = useState(() => assigned ? String(employee.monthly_basic_salary) : '')
  const [error, setError] = useState('')
  const salaryInput = useRef(null)

  useEffect(() => {
    salaryInput.current?.focus()
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = originalOverflow }
  }, [])

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === 'Escape' && !saving) onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose, saving])

  function handleSubmit(event) {
    event.preventDefault()
    if (saving) return
    const nextError = validateAmount(amount)
    setError(nextError)
    if (nextError) return
    onSave(amount.trim())
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/35 p-4"
      onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose() }}
    >
      <section role="dialog" aria-modal="true" aria-labelledby="salary-form-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl sm:p-8">
        <div className="mb-7 flex items-start justify-between gap-4">
          <div>
            <h2 id="salary-form-title" className="text-xl font-semibold tracking-tight text-zinc-950">
              {assigned ? 'Edit salary' : 'Assign salary'}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">{fullName(employee)}</p>
          </div>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Close" className="rounded-md px-2 py-1 text-xl leading-none text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-40">×</button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="monthly-basic-salary" className="block text-sm font-medium text-zinc-800">
            Monthly basic salary
          </label>
          <div className={`mt-2 flex h-11 items-center rounded-lg border bg-white focus-within:border-zinc-800 ${error ? 'border-red-500' : 'border-zinc-200'}`}>
            <span className="select-none pl-3 text-sm text-zinc-500" aria-hidden="true">₱</span>
            <input
              id="monthly-basic-salary"
              ref={salaryInput}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={amount}
              onChange={(event) => { setAmount(event.target.value); setError('') }}
              placeholder="0.00"
              disabled={saving}
              required
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'monthly-basic-salary-error' : undefined}
              className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 disabled:opacity-50"
            />
          </div>
          {error && <p id="monthly-basic-salary-error" className="mt-1 text-xs text-red-600">{error}</p>}
          {serverError && <p role="alert" className="mt-5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</p>}
          <div className="mt-8 flex justify-end gap-3">
            <button type="button" onClick={onClose} disabled={saving} className="rounded-lg border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50">
              {saving ? 'Saving…' : assigned ? 'Save changes' : 'Assign salary'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
