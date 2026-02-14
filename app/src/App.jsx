import { useEffect } from 'react'
import { BrowserRouter, Route, Switch, Redirect, useHistory } from 'react-router-dom'
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from './store/authStore'
import { AppLayout } from './components/layout'
import { usePushNotifications } from './features/notifications/usePushNotifications'
import { setApiNavigate } from './lib/api'

import LandingPage from './pages/LandingPage'
import TermsOfServicePage from './pages/TermsOfServicePage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import RefundPolicyPage from './pages/RefundPolicyPage'
import ContactPage from './pages/ContactPage'
import DemoPage from './pages/DemoPage'
import PhonePage from './features/auth/PhonePage'
import VerifyOTPPage from './features/auth/VerifyOTPPage'
import HomePage from './features/home/HomePage'
import InvoiceListPage from './features/invoices/InvoiceListPage'
import InvoiceDetailPage from './features/invoices/InvoiceDetailPage'
import NewInvoicePage from './features/invoices/NewInvoicePage'
import SettingsPage from './features/settings/SettingsPage'
import AccountProfilePage from './features/settings/AccountProfilePage'
import ReportsPage from './features/reports/ReportsPage'
import TemplateSelectPage from './features/templates/TemplateSelectPage'
import TemplateEditorPage from './features/templates/TemplateEditorPage'
import CustomerListPage from './features/customers/CustomerListPage'
import ProductListPage from './features/products/ProductListPage'
import PlansPage from './features/plans/PlansPage'

// Admin pages
import AdminLayout from './features/admin/AdminLayout'
import AdminDashboardPage from './features/admin/AdminDashboardPage'
import AdminBusinessListPage from './features/admin/AdminBusinessListPage'
import AdminBusinessDetailPage from './features/admin/AdminBusinessDetailPage'
import AdminUserListPage from './features/admin/AdminUserListPage'
import AdminUserDetailPage from './features/admin/AdminUserDetailPage'
import AdminPlanListPage from './features/admin/AdminPlanListPage'
import AdminSettingsPage from './features/admin/AdminSettingsPage'
import AdminAuditLogPage from './features/admin/AdminAuditLogPage'
import AdminBillingPage from './features/admin/AdminBillingPage'
import AdminNotificationsPage from './features/admin/AdminNotificationsPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1
    }
  }
})

/**
 * Hook to handle Capacitor-specific events inside the Router context:
 * - app:deeplink → navigate via React Router
 * - app:resume  → invalidate stale queries so data refreshes
 */
function useCapacitorListeners() {
  const history = useHistory()
  const qc = useQueryClient()

  useEffect(() => {
    const handleDeepLink = (e) => {
      const path = e.detail?.path
      if (path) history.push(path)
    }
    const handleResume = () => {
      qc.invalidateQueries()
    }
    document.addEventListener('app:deeplink', handleDeepLink)
    document.addEventListener('app:resume', handleResume)
    return () => {
      document.removeEventListener('app:deeplink', handleDeepLink)
      document.removeEventListener('app:resume', handleResume)
    }
  }, [history, qc])
}

/**
 * Wires React Router history into the Axios 401 interceptor so that
 * auth redirects use history.push() instead of window.location.href.
 * This prevents a full page reload in Capacitor WebView.
 */
function ApiNavigateWirer() {
  const history = useHistory()
  useEffect(() => {
    setApiNavigate((path) => history.push(path))
    return () => setApiNavigate(null)
  }, [history])
  return null
}

function AuthenticatedApp() {
  usePushNotifications()
  useCapacitorListeners()
  return (
    <AppLayout>
      <Switch>
        <Route exact path="/home" component={HomePage} />
        <Route exact path="/invoices" component={InvoiceListPage} />
        <Route exact path="/invoices/new" component={NewInvoicePage} />
        <Route exact path="/invoices/:id/edit" component={NewInvoicePage} />
        <Route exact path="/invoices/:id/pdf" render={({ match }) => <Redirect to={`/invoices/${match.params.id}`} />} />
        <Route exact path="/invoices/:id" component={InvoiceDetailPage} />
        <Route exact path="/customers" component={CustomerListPage} />
        <Route exact path="/products" component={ProductListPage} />
        <Route exact path="/settings" component={SettingsPage} />
        <Route exact path="/account" component={AccountProfilePage} />
        <Route exact path="/plans" component={PlansPage} />
        <Route exact path="/reports" component={ReportsPage} />
        <Route exact path="/templates" component={TemplateSelectPage} />
        <Route exact path="/templates/editor" component={TemplateEditorPage} />
        <Route exact path="/">
          <Redirect to="/home" />
        </Route>
        <Redirect to="/home" />
      </Switch>
    </AppLayout>
  )
}

function AdminApp() {
  usePushNotifications()
  useCapacitorListeners()
  return (
    <AdminLayout>
      <Switch>
        <Route exact path="/admin" component={AdminDashboardPage} />
        <Route exact path="/admin/businesses" component={AdminBusinessListPage} />
        <Route exact path="/admin/businesses/:id" component={AdminBusinessDetailPage} />
        <Route exact path="/admin/users" component={AdminUserListPage} />
        <Route exact path="/admin/users/:id" component={AdminUserDetailPage} />
        <Route exact path="/admin/plans" component={AdminPlanListPage} />
        <Route exact path="/admin/billing" component={AdminBillingPage} />
        <Route exact path="/admin/notifications" component={AdminNotificationsPage} />
        <Route exact path="/admin/settings" component={AdminSettingsPage} />
        <Route exact path="/admin/audit-logs" component={AdminAuditLogPage} />
        <Route exact path="/">
          <Redirect to="/admin" />
        </Route>
        <Redirect to="/admin" />
      </Switch>
    </AdminLayout>
  )
}

function App() {
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ApiNavigateWirer />
        {!token ? (
          <Switch>
            <Route exact path="/" component={LandingPage} />
            <Route exact path="/terms" component={TermsOfServicePage} />
            <Route exact path="/privacy" component={PrivacyPolicyPage} />
            <Route exact path="/refund-policy" component={RefundPolicyPage} />
            <Route exact path="/contact" component={ContactPage} />
            <Route exact path="/demo" component={DemoPage} />
            <Route exact path="/auth/phone" component={PhonePage} />
            <Route exact path="/auth/verify" component={VerifyOTPPage} />
            <Redirect to="/" />
          </Switch>
        ) : isSuperAdmin ? (
          <AdminApp />
        ) : (
          <AuthenticatedApp />
        )}
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
