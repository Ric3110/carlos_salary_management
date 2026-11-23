import { useEffect, useRef, useState } from 'react'

const fromEmployee = (employee) => ({
  first_name: employee?.first_name ?? '',
  middle_name: employee?.middle_name ?? '',
  last_name: employee?.last_name ?? '',
  date_hired: employee?.date_hired ? String(employee.date_hired).slice(0, 10) : '',
})

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

function validate(values) {
  const errors = {}
  if (!values.first_name.trim()) errors.first_name = 'First name is required.'
  else if (values.first_name.trim().length > 100) errors.first_name = 'Maximum 100 characters.'
  if (values.middle_name.trim().length > 100) errors.middle_name = 'Maximum 100 characters.'
  if (!values.last_name.trim()) errors.last_name = 'Last name is required.'
  else if (values.last_name.trim().length > 100) errors.last_name = 'Maximum 100 characters.'
  if (!validDate(values.date_hired)) errors.date_hired = 'Enter a valid date.'
  return errors
}

const fields = [
  { key: 'first_name', label: 'First name', type: 'text', autocomplete: 'given-name', required: true },
  { key: 'middle_name', label: 'Middle name', type: 'text', autocomplete: 'additional-name' },
  { key: 'last_name', label: 'Last name', type: 'text', autocomplete: 'family-name', required: true },
  { key: 'date_hired', label: 'Date hired', type: 'date', required: true },
]

export default function EmployeeFormModal({ employee, onClose, onSave, saving, serverError }) {
  const [values, setValues] = useState(() => fromEmployee(employee))
  const [errors, setErrors] = useState({})
  const firstInput = useRef(null)
  const editing = Boolean(employee)

  useEffect(() => {
    firstInput.current?.focus()
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = originalOverflow }
  }, [])

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !saving) onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose, saving])

  function updateField(key, next) {
    setValues((current) => ({ ...current, [key]: next }))
    setErrors((current) => ({ ...current, [key]: '' }))
  }

  function submit(event) {
    event.preventDefault()
    if (saving) return
    const nextErrors = validate(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    onSave({
      first_name: values.first_name.trim(),
      middle_name: values.middle_name.trim() || null,
      last_name: values.last_name.trim(),
      date_hired: values.date_hired,
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/35 p-4"
      onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose() }}
    >
      <section role="dialog" aria-modal="true" aria-labelledby="employee-form-title" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl sm:p-8">
        <div className="mb-7 flex items-start justify-between gap-4">
          <h2 id="employee-form-title" className="text-xl font-semibold tracking-tight text-zinc-950">
            {editing ? 'Edit employee' : 'Add employee'}
          </h2>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Close" className="rounded-md px-2 py-1 text-xl leading-none text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-40">×</button>
        </div>
        <form noValidate onSubmit={submit}>
          <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
            {fields.map(({ key, label, type, autocomplete, required }, index) => (
              <label key={key} className="block text-sm font-medium text-zinc-800">
                {label}
                <input
                  ref={index === 0 ? firstInput : undefined}
                  type={type}
                  autoComplete={autocomplete}
                  value={values[key]}
                  maxLength={type === 'text' ? 100 : undefined}
                  onChange={(event) => updateField(key, event.target.value)}
                  required={required}
                  disabled={saving}
                  aria-invalid={Boolean(errors[key])}
                  aria-describedby={errors[key] ? `${key}-error` : undefined}
                  className={`mt-2 block h-11 w-full rounded-lg border bg-white px-3 text-sm font-normal text-zinc-900 outline-none transition-colors focus:border-zinc-800 disabled:opacity-50 ${errors[key] ? 'border-red-500' : 'border-zinc-200'}`}
                />
                {errors[key] && <span id={`${key}-error`} className="mt-1 block text-xs font-normal text-red-600">{errors[key]}</span>}
              </label>
            ))}
          </div>
          {serverError && <p role="alert" className="mt-5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</p>}
          <div className="mt-8 flex justify-end gap-3">
            <button type="button" onClick={onClose} disabled={saving} className="rounded-lg border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50">{saving ? 'Saving…' : editing ? 'Save changes' : 'Add employee'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}
