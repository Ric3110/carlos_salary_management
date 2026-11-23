import { useEffect, useMemo, useState } from 'react'
import AssignmentFormModal from '../components/salary-components/AssignmentFormModal'
import ComponentLibraryModal from '../components/salary-components/ComponentLibraryModal'
import {
  assignEmployeeSalaryComponent,
  createSalaryComponent,
  deleteSalaryComponent,
  getEmployeeSalaryComponents,
  getEmployees,
  getSalaryComponents,
  removeEmployeeSalaryComponent,
  updateEmployeeSalaryComponent,
  updateSalaryComponent,
} from '../lib/api'

const peso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })

const employeeName = (employee) =>
  [employee.first_name, employee.middle_name, employee.last_name].filter(Boolean).join(' ')

const compareNames = (a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
const formatMoney = (amount) => Number.isFinite(Number(amount)) ? peso.format(Number(amount)) : '—'

export default function SalaryComponentsPage() {
  const [employees, setEmployees] = useState([])
  const [catalog, setCatalog] = useState([])
  const [employeeId, setEmployeeId] = useState('')
  const [assignments, setAssignments] = useState([])
  const [employeeSearch, setEmployeeSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [assignmentLoading, setAssignmentLoading] = useState(false)
  const [assignmentError, setAssignmentError] = useState('')
  const [assignmentRefreshKey, setAssignmentRefreshKey] = useState(0)
  const [assignmentModal, setAssignmentModal] = useState(null)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [deleting, setDeleting] = useState('')
  const [notice, setNotice] = useState('')
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setLoadError('')
    Promise.all([
      getEmployees({ signal: controller.signal }),
      getSalaryComponents({ signal: controller.signal }),
    ]).then(([employeeRows, componentRows]) => {
      if (controller.signal.aborted) return
      if (!Array.isArray(employeeRows) || !Array.isArray(componentRows)) {
        throw new Error('Unable to load employees or components.')
      }
      setEmployees(employeeRows.slice().sort((a, b) => employeeName(a).localeCompare(employeeName(b))))
      setCatalog(componentRows.slice().sort(compareNames))
      setAssignmentLoading(true)
      setEmployeeId((previous) => employeeRows.some((row) => String(row.employee_id) === previous)
        ? previous
        : String(employeeRows[0]?.employee_id ?? ''))
    }).catch((error) => {
      if (!controller.signal.aborted) setLoadError(error.message || 'Unable to load components.')
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false)
    })
    return () => controller.abort()
  }, [refreshKey])

  useEffect(() => {
    if (!employeeId || loadError) {
      setAssignments([])
      setAssignmentLoading(false)
      return
    }
    const controller = new AbortController()
    setAssignmentLoading(true)
    setAssignmentError('')
    getEmployeeSalaryComponents(employeeId, { signal: controller.signal })
      .then((rows) => {
        if (controller.signal.aborted) return
        if (!Array.isArray(rows)) throw new Error('Unable to load employee components.')
        setAssignments(rows)
      })
      .catch((error) => {
        if (controller.signal.aborted) return
        setAssignments([])
        setAssignmentError(error.message || 'Unable to load employee components.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setAssignmentLoading(false)
      })
    return () => controller.abort()
  }, [employeeId, assignmentRefreshKey, loadError])

  const selectedEmployee = useMemo(
    () => employees.find((row) => String(row.employee_id) === employeeId),
    [employees, employeeId],
  )

  const filteredEmployees = useMemo(() => {
    const query = employeeSearch.trim().toLocaleLowerCase()
    return query
      ? employees.filter((employee) => employeeName(employee).toLocaleLowerCase().includes(query))
      : employees
  }, [employees, employeeSearch])

  const activeAssignments = useMemo(() => assignments.slice().sort(compareNames), [assignments])
  const availableComponents = useMemo(() => {
    const assigned = new Set(assignments.map((row) => String(row.salary_component_id)))
    return catalog.filter((component) => !assigned.has(String(component.salary_component_id)))
  }, [assignments, catalog])
  const componentsTotal = useMemo(
    () => assignments.reduce((sum, row) => sum + Math.round(Number(row.amount || 0) * 100), 0) / 100,
    [assignments],
  )

  const busy = saving || Boolean(deleting)
  const canAssign = selectedEmployee && !loading && !loadError && !assignmentLoading && !assignmentError && availableComponents.length > 0 && !busy

  function selectEmployee(id) {
    if (busy || id === employeeId) return
    setEmployeeId(id)
    setAssignments([])
    setAssignmentLoading(true)
    setAssignmentError('')
    setActionError('')
    setNotice('')
  }

  function openAssignment(item = null) {
    if (!selectedEmployee || busy) return
    setFormError('')
    setActionError('')
    setNotice('')
    setAssignmentModal({ item, employeeId })
  }

  function openLibrary() {
    if (busy) return
    setLibraryOpen(true)
    setFormError('')
    setActionError('')
    setNotice('')
  }

  async function saveAssignment(payload) {
    if (busy || !assignmentModal || assignmentModal.employeeId !== employeeId) return
    const editing = Boolean(assignmentModal.item)
    setSaving(true)
    setFormError('')
    try {
      const saved = editing
        ? await updateEmployeeSalaryComponent(employeeId, assignmentModal.item.salary_component_id, payload.amount)
        : await assignEmployeeSalaryComponent(employeeId, payload.salary_component_id, payload.amount)
      setAssignments((current) => editing
        ? current.map((item) => String(item.salary_component_id) === String(saved.salary_component_id) ? saved : item)
        : [...current, saved])
      setAssignmentModal(null)
      setNotice(editing ? 'Amount updated.' : 'Component assigned.')
    } catch (error) {
      setFormError(error.message || 'Unable to save assignment.')
    } finally {
      setSaving(false)
    }
  }

  async function saveComponentName(name, component = null) {
    if (busy) return false
    setSaving(true)
    setFormError('')
    try {
      const saved = component
        ? await updateSalaryComponent(component.salary_component_id, name)
        : await createSalaryComponent(name)
      setCatalog((current) => (component
        ? current.map((row) => String(row.salary_component_id) === String(saved.salary_component_id) ? saved : row)
        : [...current, saved]).sort(compareNames))
      if (component) {
        setAssignments((current) => current.map((row) =>
          String(row.salary_component_id) === String(saved.salary_component_id)
            ? { ...row, name: saved.name }
            : row))
      }
      setNotice(component ? 'Component renamed.' : 'Component created.')
      return true
    } catch (error) {
      setFormError(error.message || 'Unable to save component.')
      return false
    } finally {
      setSaving(false)
    }
  }

  async function deleteComponent(component) {
    if (busy || !window.confirm(`Delete “${component.name}” for all employees?`)) return
    setDeleting(`component-${component.salary_component_id}`)
    setFormError('')
    try {
      await deleteSalaryComponent(component.salary_component_id)
      setCatalog((current) => current.filter((row) => String(row.salary_component_id) !== String(component.salary_component_id)))
      setAssignments((current) => current.filter((row) => String(row.salary_component_id) !== String(component.salary_component_id)))
      setNotice('Component deleted.')
    } catch (error) {
      setFormError(error.message || 'Unable to delete component.')
    } finally {
      setDeleting('')
    }
  }

  async function removeAssignment(assignment) {
    if (busy || !selectedEmployee || !window.confirm(`Remove “${assignment.name}” from ${employeeName(selectedEmployee)}?`)) return
    setDeleting(`assignment-${assignment.salary_component_id}`)
    setNotice('')
    setActionError('')
    try {
      await removeEmployeeSalaryComponent(employeeId, assignment.salary_component_id)
      setAssignments((current) => current.filter((row) => String(row.salary_component_id) !== String(assignment.salary_component_id)))
      setNotice('Component removed.')
    } catch (error) {
      setActionError(error.message || 'Unable to remove component.')
    } finally {
      setDeleting('')
    }
  }

  return (
    <section>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">Components</h1>
        <button
          type="button"
          onClick={openLibrary}
          disabled={loading || Boolean(loadError) || busy}
          className="rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Manage components
        </button>
      </div>

      {notice && <div role="status" className="mb-4 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}<button type="button" onClick={() => setNotice('')} className="ml-3 underline underline-offset-2">Dismiss</button></div>}
      {(loadError || actionError) && (
        <div role="alert" className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{loadError || actionError}</span>
          {loadError
            ? <button type="button" onClick={() => setRefreshKey((key) => key + 1)} className="shrink-0 font-medium underline underline-offset-2">Retry</button>
            : <button type="button" onClick={() => setActionError('')} className="shrink-0 font-medium underline underline-offset-2">Dismiss</button>}
        </div>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="overflow-hidden rounded-xl border border-zinc-200 bg-white" aria-label="Employees">
          <div className="border-b border-zinc-100 px-4 py-4">
            <h2 className="mb-3 text-sm font-semibold text-zinc-900">Employees</h2>
            <label htmlFor="components-employee-search" className="sr-only">Search employees</label>
            <input
              id="components-employee-search"
              type="search"
              value={employeeSearch}
              onChange={(event) => setEmployeeSearch(event.target.value)}
              placeholder="Search employees"
              className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-600"
            />
          </div>
          <div className="max-h-[420px] overflow-y-auto p-2 lg:max-h-[540px]">
            {loading ? (
              <p className="px-3 py-8 text-center text-sm text-zinc-400">Loading…</p>
            ) : loadError ? (
              <p className="px-3 py-8 text-center text-sm text-zinc-400">Unable to load employees.</p>
            ) : filteredEmployees.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-zinc-400">{employeeSearch.trim() ? 'No matching employees.' : 'No employees yet.'}</p>
            ) : filteredEmployees.map((employee) => {
              const selected = String(employee.employee_id) === employeeId
              return (
                <button
                  key={employee.employee_id}
                  type="button"
                  aria-current={selected ? 'true' : undefined}
                  onClick={() => selectEmployee(String(employee.employee_id))}
                  disabled={busy}
                  className={`mb-1 block w-full rounded-lg px-3 py-3 text-left text-sm font-medium transition-colors disabled:cursor-not-allowed ${selected ? 'bg-zinc-900 text-white' : 'text-zinc-800 hover:bg-zinc-100'} ${busy && !selected ? 'opacity-50' : ''}`}
                >
                  {employeeName(employee)}
                </button>
              )
            })}
          </div>
        </aside>

        <div className="min-w-0 overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-100 px-5 py-5 sm:px-6">
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-zinc-900">{selectedEmployee ? employeeName(selectedEmployee) : 'Active components'}</h2>
              {selectedEmployee && <p className="mt-0.5 text-sm text-zinc-500">Active components</p>}
            </div>
            <button
              type="button"
              onClick={() => catalog.length === 0 ? openLibrary() : openAssignment()}
              disabled={catalog.length === 0 ? loading || Boolean(loadError) || busy : !canAssign}
              className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {catalog.length === 0 ? '+ New component' : availableComponents.length === 0 ? 'All assigned' : '+ Assign component'}
            </button>
          </div>

          {assignmentError && (
            <div role="alert" className="flex items-center justify-between gap-3 border-b border-zinc-100 px-5 py-3 text-sm text-red-700 sm:px-6">
              <span>{assignmentError}</span>
              <button type="button" onClick={() => setAssignmentRefreshKey((key) => key + 1)} className="font-medium underline underline-offset-2">Retry</button>
            </div>
          )}
          <div className="min-h-[260px]">
            {loading || (selectedEmployee && assignmentLoading) ? (
              <div className="px-5 py-20 text-center text-sm text-zinc-400">Loading…</div>
            ) : loadError || assignmentError ? (
              <div className="px-5 py-20 text-center text-sm text-zinc-400">Unable to display components.</div>
            ) : !selectedEmployee ? (
              <div className="px-5 py-20 text-center text-sm text-zinc-400">Select an employee.</div>
            ) : activeAssignments.length === 0 ? (
              <div className="px-5 py-20 text-center text-sm text-zinc-400">No active components.</div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {activeAssignments.map((assignment) => (
                  <div key={assignment.employee_salary_component_id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
                    <p className="min-w-0 flex-1 text-sm font-medium text-zinc-900">{assignment.name}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:gap-x-6">
                      <span className="min-w-[110px] text-right text-sm font-medium tabular-nums text-zinc-900">{formatMoney(assignment.amount)}</span>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => openAssignment(assignment)} disabled={busy} className="rounded-md px-2 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-40">Edit</button>
                        <button type="button" onClick={() => removeAssignment(assignment)} disabled={busy} className="rounded-md px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-40">Remove</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {!loading && !loadError && !assignmentLoading && !assignmentError && selectedEmployee && activeAssignments.length > 0 && (
            <div className="flex items-center justify-between gap-3 border-t border-zinc-100 bg-zinc-50/70 px-5 py-4 sm:px-6">
              <span className="text-sm font-medium text-zinc-600">Total components</span>
              <span className="text-sm font-semibold tabular-nums text-zinc-950">{formatMoney(componentsTotal)}</span>
            </div>
          )}
        </div>
      </div>

      {assignmentModal && selectedEmployee && (
        <AssignmentFormModal
          key={`${assignmentModal.employeeId}-${assignmentModal.item?.salary_component_id ?? 'new'}`}
          employee={selectedEmployee}
          assignment={assignmentModal.item}
          availableComponents={availableComponents}
          saving={saving}
          serverError={formError}
          onClose={() => { if (!saving) setAssignmentModal(null) }}
          onSave={saveAssignment}
        />
      )}
      {libraryOpen && (
        <ComponentLibraryModal
          components={catalog}
          saving={busy}
          error={formError}
          onClearError={() => setFormError('')}
          onClose={() => { if (!busy) { setLibraryOpen(false); setFormError('') } }}
          onCreate={(name) => saveComponentName(name)}
          onRename={(component, name) => saveComponentName(name, component)}
          onDelete={deleteComponent}
        />
      )}
    </section>
  )
}
