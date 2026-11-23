import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { getEmployeeSalaryRates, getSalaryRateEmployees } from '../lib/api'

const peso = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
})

function employeeName(employee) {
  return [employee.first_name, employee.middle_name, employee.last_name]
    .filter(Boolean)
    .join(' ')
}

function formatAmount(amount) {
  const value = Number(amount)
  return Number.isFinite(value) ? peso.format(value) : '—'
}

function formattedRate(row, field) {
  return row?.formatted?.[field] ?? (row?.[field] == null ? '—' : formatAmount(row[field]))
}

export default function SalaryRatesPage() {
  const [employees, setEmployees] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [query, setQuery] = useState('')
  const [loadingEmployees, setLoadingEmployees] = useState(true)
  const [employeeError, setEmployeeError] = useState('')
  const [detail, setDetail] = useState(null)
  const [loadingRates, setLoadingRates] = useState(false)
  const [rateError, setRateError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setLoadingEmployees(true)
    setEmployeeError('')

    getSalaryRateEmployees({ signal: controller.signal })
      .then((records) => {
        if (controller.signal.aborted) return
        if (!Array.isArray(records)) throw new Error('Unable to load employees.')
        setEmployees(records)
        setSelectedId((current) => {
          if (records.some((row) => String(row.employee_id) === current)) return current
          const firstWithSalary = records.find((row) => row.has_salary_assignment)
          return String((firstWithSalary ?? records[0])?.employee_id ?? '')
        })
      })
      .catch((error) => {
        if (!controller.signal.aborted) setEmployeeError(error.message || 'Unable to load employees.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingEmployees(false)
      })

    return () => controller.abort()
  }, [refreshKey])

  const selected = useMemo(
    () => employees.find((employee) => String(employee.employee_id) === selectedId),
    [employees, selectedId],
  )

  const visibleEmployees = useMemo(() => {
    const term = query.trim().toLocaleLowerCase()
    return term
      ? employees.filter((employee) => employeeName(employee).toLocaleLowerCase().includes(term))
      : employees
  }, [employees, query])

  useEffect(() => {
    if (!selectedId || !selected?.has_salary_assignment) {
      setDetail(null)
      setRateError('')
      setLoadingRates(false)
      return
    }

    const controller = new AbortController()
    setLoadingRates(true)
    setRateError('')
    setDetail(null)

    getEmployeeSalaryRates(selectedId, { signal: controller.signal })
      .then((result) => {
        if (controller.signal.aborted) return
        if (!result?.breakdown?.total || !result?.breakdown?.basic_salary) {
          throw new Error('Unable to load salary rates.')
        }
        setDetail(result)
      })
      .catch((error) => {
        if (!controller.signal.aborted) setRateError(error.message || 'Unable to load salary rates.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingRates(false)
      })

    return () => controller.abort()
  }, [selectedId, selected?.has_salary_assignment, refreshKey])

  const currentDetail = detail && String(detail.employee?.employee_id) === selectedId ? detail : null
  const breakdown = currentDetail?.breakdown

  return (
    <section>
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">Rates</h1>
        <button
          type="button"
          onClick={() => setRefreshKey((value) => value + 1)}
          disabled={loadingEmployees || loadingRates}
          className="rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      {employeeError && (
        <div role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {employeeError}
        </div>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <div className="border-b border-zinc-100 p-4">
            <label htmlFor="rates-employee-search" className="sr-only">Search employees</label>
            <input
              id="rates-employee-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search employees"
              className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-600"
            />
          </div>
          <div className="max-h-[240px] overflow-y-auto p-2 lg:max-h-[420px]" aria-label="Employees">
            {loadingEmployees ? (
              <p className="px-3 py-8 text-center text-sm text-zinc-400">Loading…</p>
            ) : employeeError ? (
              <p className="px-3 py-8 text-center text-sm text-zinc-400">Unable to display employees.</p>
            ) : visibleEmployees.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-zinc-400">
                {query.trim() ? 'No matching employees.' : 'No employees yet.'}
              </p>
            ) : visibleEmployees.map((employee) => {
              const active = String(employee.employee_id) === selectedId
              return (
                <button
                  type="button"
                  key={employee.employee_id}
                  onClick={() => setSelectedId(String(employee.employee_id))}
                  aria-pressed={active}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-3 text-left text-sm transition-colors ${
                    active ? 'bg-zinc-900 font-medium text-white' : 'text-zinc-700 hover:bg-zinc-50'
                  }`}
                >
                  <span className="min-w-0 truncate">{employeeName(employee)}</span>
                  {!employee.has_salary_assignment && (
                    <span className={`shrink-0 text-xs ${active ? 'text-zinc-300' : 'text-zinc-400'}`}>Unassigned</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="min-w-0 overflow-hidden rounded-xl border border-zinc-200 bg-white">
          {loadingEmployees ? (
            <div className="px-6 py-24 text-center text-sm text-zinc-400">Loading…</div>
          ) : employeeError ? (
            <div className="px-6 py-24 text-center text-sm text-zinc-400">Unable to display rates.</div>
          ) : !selected ? (
            <div className="px-6 py-24 text-center text-sm text-zinc-400">Select an employee.</div>
          ) : !selected.has_salary_assignment ? (
            <div className="px-6 py-20 text-center">
              <p className="text-sm text-zinc-500">No salary assigned for {employeeName(selected)}.</p>
              <Link to="/salary-assignments" className="mt-4 inline-flex rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">
                Assign salary
              </Link>
            </div>
          ) : loadingRates || (!currentDetail && !rateError) ? (
            <div className="px-6 py-24 text-center text-sm text-zinc-400">Calculating…</div>
          ) : rateError ? (
            <div role="alert" className="px-6 py-20 text-center">
              <p className="text-sm text-red-700">{rateError}</p>
              <button
                type="button"
                onClick={() => setRefreshKey((value) => value + 1)}
                className="mt-4 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              <div className="border-b border-zinc-100 px-5 py-6 sm:px-7 sm:py-7">
                <p className="truncate text-sm font-medium text-zinc-500">{employeeName(selected)}</p>
                <p className="mt-5 text-sm text-zinc-500">Monthly total</p>
                <p className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl tabular-nums">
                  {formattedRate(breakdown.total, 'monthly')}
                </p>
                <div className="mt-7 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4">
                  {[
                    ['Annual', 'annual'],
                    ['Daily', 'daily'],
                    ['Hourly', 'hourly'],
                    ['Per minute', 'per_minute'],
                  ].map(([label, field]) => (
                    <div key={field}>
                      <p className="text-xs text-zinc-500">{label}</p>
                      <p className="mt-1 text-base font-semibold text-zinc-900 tabular-nums sm:text-lg">
                        {formattedRate(breakdown.total, field)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-5 py-6 sm:px-7">
                <h2 className="mb-4 text-base font-semibold text-zinc-900">Breakdown</h2>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[340px] text-sm">
                    <thead>
                      <tr className="border-b border-zinc-100 text-zinc-500">
                        <th scope="col" className="pb-3 text-left font-medium">Description</th>
                        <th scope="col" className="pb-3 text-right font-medium">Monthly</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-zinc-100">
                        <td className="py-3.5 text-zinc-700">Basic salary</td>
                        <td className="py-3.5 text-right tabular-nums text-zinc-900">{formattedRate(breakdown.basic_salary, 'monthly')}</td>
                      </tr>
                      {(breakdown.components ?? []).map((component) => (
                        <tr key={component.salary_component_id} className="border-b border-zinc-100">
                          <td className="py-3.5 text-zinc-700">{component.name}</td>
                          <td className="py-3.5 text-right tabular-nums text-zinc-900">{formattedRate(component, 'monthly')}</td>
                        </tr>
                      ))}
                      <tr>
                        <th scope="row" className="pt-4 text-left font-semibold text-zinc-950">Total</th>
                        <td className="pt-4 text-right font-semibold tabular-nums text-zinc-950">{formattedRate(breakdown.total, 'monthly')}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <details className="mt-6 border-t border-zinc-100 pt-5">
                  <summary className="cursor-pointer select-none text-sm font-medium text-zinc-700 hover:text-zinc-950">
                    Detailed rates
                  </summary>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[710px] text-sm">
                      <thead>
                        <tr className="border-b border-zinc-100 text-zinc-500">
                          <th scope="col" className="py-3 pr-4 text-left font-medium">Description</th>
                          {['Monthly', 'Annual', 'Daily', 'Hourly', 'Per minute'].map((label) => (
                            <th key={label} scope="col" className="whitespace-nowrap px-2 py-3 text-right font-medium">{label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { label: 'Basic salary', values: breakdown.basic_salary },
                          ...(breakdown.components ?? []).map((item) => ({ label: item.name, values: item })),
                          ...(breakdown.components?.length ? [{ label: 'Components total', values: breakdown.components_total }] : []),
                          { label: 'Total', values: breakdown.total, total: true },
                        ].map((row, index) => (
                          <tr key={`${row.label}-${index}`} className={`border-b border-zinc-100 last:border-0 ${row.total ? 'font-semibold text-zinc-950' : 'text-zinc-700'}`}>
                            <th scope="row" className="py-3 pr-4 text-left font-medium">{row.label}</th>
                            {['monthly', 'annual', 'daily', 'hourly', 'per_minute'].map((field) => (
                              <td key={field} className="whitespace-nowrap px-2 py-3 text-right tabular-nums">{formattedRate(row.values, field)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
