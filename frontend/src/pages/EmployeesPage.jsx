import { useEffect, useMemo, useState } from 'react'
import EmployeeFormModal from '../components/employees/EmployeeFormModal'
import { createEmployee, getEmployees, updateEmployee } from '../lib/api'

const PAGE_SIZE = 12

function fullName(employee) {
  return [employee.first_name, employee.middle_name, employee.last_name].filter(Boolean).join(' ')
}

function formatHiredDate(value) {
  const iso = String(value ?? '').slice(0, 10)
  const date = new Date(`${iso}T00:00:00Z`)
  if (!iso || Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-PH', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date)
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [modal, setModal] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setLoadError('')
    getEmployees({ signal: controller.signal })
      .then((records) => {
        if (!controller.signal.aborted) {
          if (!Array.isArray(records)) throw new Error('Unable to load employees.')
          setEmployees(records)
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) setLoadError(error.message || 'Unable to load employees.')
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [refreshKey])

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase()
    return term ? employees.filter((item) => fullName(item).toLocaleLowerCase().includes(term)) : employees
  }, [employees, query])
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pages - 1)
  const visible = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)

  function openCreate() {
    setSaveError('')
    setFeedback('')
    setModal({ mode: 'create' })
  }
  function openEdit(employee) {
    setSaveError('')
    setFeedback('')
    setModal({ mode: 'edit', employee })
  }

  async function saveEmployee(payload) {
    if (saving || !modal) return
    const editing = modal.mode === 'edit'
    setSaving(true)
    setSaveError('')
    try {
      const saved = editing
        ? await updateEmployee(modal.employee.employee_id, payload)
        : await createEmployee(payload)
      setEmployees((current) => {
        const next = editing
          ? current.map((item) => item.employee_id === saved.employee_id ? saved : item)
          : [...current, saved]
        return next.sort((a, b) => Number(a.employee_id) - Number(b.employee_id))
      })
      setModal(null)
      setFeedback(editing ? 'Changes saved.' : 'Employee added.')
    } catch (error) {
      setSaveError(error.message || 'Unable to save employee.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">Employees</h1>
        <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700">
          <span aria-hidden="true" className="text-lg leading-none">+</span> Add employee
        </button>
      </div>

      {feedback && <div role="status" className="mb-5 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{feedback}<button onClick={() => setFeedback('')} className="ml-4 text-emerald-700 underline underline-offset-2" type="button">Dismiss</button></div>}
      {loadError && <div role="alert" className="mb-5 flex items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"><span>{loadError}</span><button type="button" className="shrink-0 font-medium underline underline-offset-2" onClick={() => setRefreshKey((value) => value + 1)}>Retry</button></div>}

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-5 py-4 sm:px-6">
          <label className="sr-only" htmlFor="employee-search">Search employees</label>
          <input
            id="employee-search"
            type="search"
            value={query}
            onChange={(event) => { setQuery(event.target.value); setPage(0) }}
            placeholder="Search employees"
            className="h-10 w-full max-w-sm rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-600"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] text-left text-sm">
            <thead className="border-b border-zinc-100 bg-zinc-50/70 text-zinc-500">
              <tr>
                <th scope="col" className="px-5 py-3 font-medium sm:px-6">Name</th>
                <th scope="col" className="px-5 py-3 font-medium">Date hired</th>
                <th scope="col" className="px-5 py-3 text-right font-medium sm:px-6"> </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr><td colSpan={3} className="px-6 py-14 text-center text-zinc-400">Loading…</td></tr>
              ) : loadError ? (
                <tr><td colSpan={3} className="px-6 py-14 text-center text-zinc-400">Unable to display employees.</td></tr>
              ) : visible.length === 0 ? (
                <tr><td colSpan={3} className="px-6 py-14 text-center text-zinc-400">{query.trim() ? 'No matching employees.' : 'No employees yet.'}</td></tr>
              ) : visible.map((employee) => (
                <tr key={employee.employee_id} className="hover:bg-zinc-50/70">
                  <td className="px-5 py-4 font-medium text-zinc-900 sm:px-6">{fullName(employee)}</td>
                  <td className="px-5 py-4 text-zinc-600">{formatHiredDate(employee.date_hired)}</td>
                  <td className="px-5 py-4 text-right sm:px-6">
                    <button type="button" onClick={() => openEdit(employee)} className="rounded-md px-3 py-1.5 font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950" aria-label={`Edit ${fullName(employee)}`}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && !loadError && pages > 1 && (
          <div className="flex justify-end gap-2 border-t border-zinc-100 px-5 py-4 sm:px-6">
            <button type="button" disabled={currentPage === 0} onClick={() => setPage((p) => Math.max(p - 1, 0))} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
            <button type="button" disabled={currentPage >= pages - 1} onClick={() => setPage((p) => Math.min(p + 1, pages - 1))} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40">Next</button>
          </div>
        )}
      </div>

      {modal && (
        <EmployeeFormModal
          key={modal.mode === 'edit' ? `edit-${modal.employee.employee_id}` : 'create'}
          employee={modal.mode === 'edit' ? modal.employee : null}
          onClose={() => { if (!saving) setModal(null) }}
          onSave={saveEmployee}
          saving={saving}
          serverError={saveError}
        />
      )}
    </section>
  )
}
