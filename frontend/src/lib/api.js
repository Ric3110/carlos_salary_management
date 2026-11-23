
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/backend').replace(/\/$/, '')

export async function apiRequest(path, options = {}) {
  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    })
  } catch (error) {
    if (error?.name === 'AbortError') throw error
    throw new Error('Unable to connect to the backend. Check that NestJS is running on port 3000.')
  }

  const raw = await response.text()
  let data = null
  if (raw) {
    try {
      data = JSON.parse(raw)
    } catch {
      data = raw
    }
  }

  if (!response.ok) {
    const details = Array.isArray(data?.message)
      ? data.message.join(' ')
      : typeof data?.message === 'string'
        ? data.message
        : typeof data === 'string'
          ? data
          : `Request failed (${response.status})`
    throw new Error(details)
  }

  return data
}

export function getEmployees(options = {}) {
  return apiRequest('/employees', options)
}

export function createEmployee(employee) {
  return apiRequest('/employees', {
    method: 'POST',
    body: JSON.stringify(employee),
  })
}

export function updateEmployee(employeeId, changes) {
  return apiRequest(`/employees/${encodeURIComponent(employeeId)}`, {
    method: 'PATCH',
    body: JSON.stringify(changes),
  })
}

export function getSalaryAssignments(options = {}) {
  return apiRequest('/salary-assignments', options)
}

export function createSalaryAssignment(employeeId, monthlyBasicSalary) {
  return apiRequest('/salary-assignments', {
    method: 'POST',
    body: JSON.stringify({
      employee_id: employeeId,
      monthly_basic_salary: monthlyBasicSalary,
    }),
  })
}

export function updateSalaryAssignment(employeeId, monthlyBasicSalary) {
  return apiRequest(`/salary-assignments/${encodeURIComponent(employeeId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ monthly_basic_salary: monthlyBasicSalary }),
  })
}

// Reusable salary-component catalog.
export function getSalaryComponents(options = {}) {
  return apiRequest('/salary-components', options)
}

export function createSalaryComponent(name) {
  return apiRequest('/salary-components', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

export function updateSalaryComponent(componentId, name) {
  return apiRequest(`/salary-components/${encodeURIComponent(componentId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  })
}

export function deleteSalaryComponent(componentId) {
  return apiRequest(`/salary-components/${encodeURIComponent(componentId)}`, {
    method: 'DELETE',
  })
}

// Salary components assigned to an employee.
export function getEmployeeSalaryComponents(employeeId, options = {}) {
  return apiRequest(`/employees/${encodeURIComponent(employeeId)}/salary-components`, options)
}

export function assignEmployeeSalaryComponent(employeeId, componentId, amount) {
  return apiRequest(`/employees/${encodeURIComponent(employeeId)}/salary-components`, {
    method: 'POST',
    body: JSON.stringify({ salary_component_id: componentId, amount }),
  })
}

export function updateEmployeeSalaryComponent(employeeId, componentId, amount) {
  return apiRequest(`/employees/${encodeURIComponent(employeeId)}/salary-components/${encodeURIComponent(componentId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ amount }),
  })
}

export function removeEmployeeSalaryComponent(employeeId, componentId) {
  return apiRequest(`/employees/${encodeURIComponent(employeeId)}/salary-components/${encodeURIComponent(componentId)}`, {
    method: 'DELETE',
  })
}

// Read-only salary computation: figures are recalculated by NestJS on request.
export function getSalaryRateEmployees(options = {}) {
  return apiRequest('/salary-rates', options)
}

export function getEmployeeSalaryRates(employeeId, options = {}) {
  return apiRequest(`/salary-rates/${encodeURIComponent(employeeId)}`, options)
}
