import { useEffect, useMemo, useState } from 'react'
import SalaryAssignmentModal from '../components/salary-assignments/SalaryAssignmentModal'
import { createSalaryAssignment, getSalaryAssignments, updateSalaryAssignment } from '../lib/api'

const PAGE_SIZE = 12
const currency = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })

function fullName(employee) {
  return [employee.first_name, employee.middle_name, employee.last_name].filter(Boolean).join(' ')
}

function hasSalary(employee) {
  return employee.monthly_basic_salary !== null && employee.monthly_basic_salary !== undefined
}

function formatSalary(value) {
  if (value === null || value === undefined) return 'Not assigned'
  const numeric = Number(value)
  return Number.isFinite(numeric) ? currency.format(numeric) : '—'
}

export default function SalaryAssignmentsPage() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setLoadError('')
    getSalaryAssignments({ signal: controller.signal })
      .then((records) => {
        if (!controller.signal.aborted) {
          if (!Array.isArray(records)) throw new Error('Unable to load salaries.')
          setEmployees(records)
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) setLoadError(error.message || 'Unable to load salaries.')
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

  function openForm(employee) {
    setSaveError('')
    setFeedback('')
    setSelected(employee)
  }

  async function saveSalary(monthlyBasicSalary) {
    if (saving || !selected) return
    const assigned = hasSalary(selected)
    setSaving(true)
    setSaveError('')
    try {
      const saved = assigned
        ? await updateSalaryAssignment(selected.employee_id, monthlyBasicSalary)
        : await createSalaryAssignment(selected.employee_id, monthlyBasicSalary)
      setEmployees((current) => current.map((employee) =>
        employee.employee_id === saved.employee_id ? saved : employee
      ))
      setSelected(null)
      setFeedback(assigned ? 'Salary updated.' : 'Salary assigned.')
    } catch (error) {
      setSaveError(error.message || 'Unable to save salary.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">Salary</h1>
      </div>

      {feedback && (
        <div role="status" className="mb-5 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {feedback}
          <button type="button" onClick={() => setFeedback('')} className="ml-4 text-emerald-700 underline underline-offset-2">Dismiss</button>
        </div>
      )}
      {loadError && (
        <div role="alert" className="mb-5 flex items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <span>{loadError}</span>
          <button type="button" onClick={() => setRefreshKey((value) => value + 1)} className="shrink-0 font-medium underline underline-offset-2">Retry</button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-5 py-4 sm:px-6">
          <label htmlFor="salary-search" className="sr-only">Search employees</label>
          <input
            id="salary-search"
            type="search"
            value={query}
            onChange={(event) => { setQuery(event.target.value); setPage(0) }}
            placeholder="Search employees"
            className="h-10 w-full max-w-sm rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-600"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[470px] text-left text-sm">
            <thead className="border-b border-zinc-100 bg-zinc-50/70 text-zinc-500">
              <tr>
                <th scope="col" className="px-5 py-3 font-medium sm:px-6">Employee</th>
                <th scope="col" className="px-5 py-3 font-medium">Monthly salary</th>
                <th scope="col" className="px-5 py-3 text-right font-medium sm:px-6"> </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr><td colSpan={3} className="px-6 py-14 text-center text-zinc-400">Loading…</td></tr>
              ) : loadError ? (
                <tr><td colSpan={3} className="px-6 py-14 text-center text-zinc-400">Unable to display salaries.</td></tr>
              ) : visible.length === 0 ? (
                <tr><td colSpan={3} className="px-6 py-14 text-center text-zinc-400">{query.trim() ? 'No matching employees.' : 'No employees yet.'}</td></tr>
              ) : visible.map((employee) => (
                <tr key={employee.employee_id} className="hover:bg-zinc-50/70">
                  <td className="px-5 py-4 font-medium text-zinc-900 sm:px-6">{fullName(employee)}</td>
                  <td className={`px-5 py-4 tabular-nums ${hasSalary(employee) ? 'text-zinc-900' : 'text-zinc-400'}`}>
                    {formatSalary(employee.monthly_basic_salary)}
                  </td>
                  <td className="px-5 py-4 text-right sm:px-6">
                    <button
                      type="button"
                      onClick={() => openForm(employee)}
                      className="rounded-md px-3 py-1.5 font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
                      aria-label={`${hasSalary(employee) ? 'Edit salary for' : 'Assign salary to'} ${fullName(employee)}`}
                    >
                      {hasSalary(employee) ? 'Edit' : 'Assign'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && !loadError && pages > 1 && (
          <div className="flex justify-end gap-2 border-t border-zinc-100 px-5 py-4 sm:px-6">
            <button type="button" disabled={currentPage === 0} onClick={() => setPage((value) => Math.max(0, value - 1))} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
            <button type="button" disabled={currentPage >= pages - 1} onClick={() => setPage((value) => Math.min(value + 1, pages - 1))} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40">Next</button>
          </div>
        )}
      </div>

      {selected && (
        <SalaryAssignmentModal
          key={selected.employee_id}
          employee={selected}
          saving={saving}
          serverError={saveError}
          onClose={() => { if (!saving) setSelected(null) }}
          onSave={saveSalary}
        />
      )}
    </section>
  )
}
