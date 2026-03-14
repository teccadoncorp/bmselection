import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import AdminLayout from '../components/layout/AdminLayout'
import OperatorLayout from '../components/layout/OperatorLayout'

// Pages
import LoginPage from '../pages/auth/LoginPage'
import AdminDashboard from '../pages/admin/Dashboard'
import AdminBeneficiaries from '../pages/admin/Beneficiaries'
import AdminOperators from '../pages/admin/Operators'
import AdminAssignments from '../pages/admin/Assignments'
import AdminGeography from '../pages/admin/Geography'
import AdminAnalytics from '../pages/admin/Analytics'
import AdminMarketing from '../pages/admin/Marketing'
import OperatorDashboard from '../pages/operator/Dashboard'
import OperatorBeneficiaries from '../pages/operator/BeneficiaryList'
import OperatorBeneficiaryDetail from '../pages/operator/BeneficiaryDetail'
import OperatorTasks from '../pages/operator/Tasks'

function RequireAuth({ children, role }) {
  const { user, accessToken } = useAuthStore()
  if (!accessToken || !user) return <Navigate to="/login" replace />
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/operator/dashboard'} replace />
  }
  return children
}

export default function AppRouter() {
  const { user, accessToken } = useAuthStore()

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          accessToken && user
            ? <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/operator/dashboard'} replace />
            : <LoginPage />
        } />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <RequireAuth role="admin"><AdminLayout /></RequireAuth>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard"     element={<AdminDashboard />} />
          <Route path="beneficiaries" element={<AdminBeneficiaries />} />
          <Route path="operators"     element={<AdminOperators />} />
          <Route path="assignments"   element={<AdminAssignments />} />
          <Route path="geography"     element={<AdminGeography />} />
          <Route path="analytics"     element={<AdminAnalytics />} />
          <Route path="marketing"     element={<AdminMarketing />} />
        </Route>

        {/* Operator Routes */}
        <Route path="/operator" element={
          <RequireAuth role="operator"><OperatorLayout /></RequireAuth>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard"            element={<OperatorDashboard />} />
          <Route path="beneficiaries"        element={<OperatorBeneficiaries />} />
          <Route path="beneficiaries/:id"    element={<OperatorBeneficiaryDetail />} />
          <Route path="tasks"                element={<OperatorTasks />} />
        </Route>

        {/* Default redirect */}
        <Route path="/" element={
          !accessToken ? <Navigate to="/login" replace />
            : user?.role === 'admin' ? <Navigate to="/admin/dashboard" replace />
            : <Navigate to="/operator/dashboard" replace />
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
