import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { supabase } from './lib/supabase'
import { useAuthStore } from './store/auth-store'
import { ProtectedRoute } from './lib/protected-route'
import { DashboardLayout } from './components/layout/DashboardLayout'
import { Login } from './pages/auth/Login'
import { Register } from './pages/auth/Register'
import { ForgotPassword } from './pages/auth/ForgotPassword'
import { Dashboard } from './pages/dashboard/index'
import { CompanyPage } from './pages/dashboard/company/index'
import { EmployeesPage } from './pages/dashboard/employees/index'
import { PayrollPage } from './pages/dashboard/payroll/index'
import { PayrollRunDetailPage } from './pages/dashboard/payroll/[runId]'
import { SubmissionsPage } from './pages/dashboard/submissions/index'
import { SettingsPage } from './pages/dashboard/settings/index'
import { MultiCompanyPage } from './pages/dashboard/multi-company/index'
import { ScheduledPayrollPage } from './pages/dashboard/scheduled-payroll/index'
import { BulkPayslipsPage } from './pages/dashboard/bulk-payslips/index'
import { AnomalyDetectionPage } from './pages/dashboard/anomaly-detection/index'
import { ReportsPage } from './pages/dashboard/reports/index'
import { AutomationPage } from './pages/dashboard/automation/index'
import { AuditLogsPage } from './pages/dashboard/audit-logs/index'
import RagChatPage from './pages/dashboard/rag/index'
import { LandingPage } from './pages/landing/index'
import { Toaster } from './components/ui/toaster'

const queryClient = new QueryClient()

function App() {
  const { setUser, setSession, setLoading } = useAuthStore()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [setUser, setSession, setLoading])

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/company"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <CompanyPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/employees"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <EmployeesPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/payroll"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <PayrollPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/payroll/:runId"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <PayrollRunDetailPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/submissions"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <SubmissionsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/settings"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <SettingsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/multi-company"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <MultiCompanyPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/scheduled-payroll"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <ScheduledPayrollPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/bulk-payslips"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <BulkPayslipsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/anomaly-detection"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <AnomalyDetectionPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/reports"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <ReportsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/automation"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <AutomationPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/audit-logs"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <AuditLogsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/rag"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <RagChatPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<LandingPage />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App

