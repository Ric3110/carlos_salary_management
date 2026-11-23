import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import AppLayout from './components/AppLayout'
import EmployeesPage from './pages/EmployeesPage'
import SalaryAssignmentsPage from './pages/SalaryAssignmentsPage'
import SalaryComponentsPage from './pages/SalaryComponentsPage'
import SalaryRatesPage from './pages/SalaryRatesPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/employees" replace />} />
          <Route path="/employees" element={<EmployeesPage />} />
          <Route path="/salary-assignments" element={<SalaryAssignmentsPage />} />
          <Route path="/salary-components" element={<SalaryComponentsPage />} />
          <Route path="/salary-rates" element={<SalaryRatesPage />} />
          <Route path="*" element={<Navigate to="/employees" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
