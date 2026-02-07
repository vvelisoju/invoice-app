import { BrowserRouter, Route, Switch, Redirect } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from './store/authStore'
import { AppLayout } from './components/layout'

import LandingPage from './pages/LandingPage'
import DemoPage from './pages/DemoPage'
import PhonePage from './features/auth/PhonePage'
import VerifyOTPPage from './features/auth/VerifyOTPPage'
import HomePage from './features/home/HomePage'
import InvoiceListPage from './features/invoices/InvoiceListPage'
import InvoiceDetailPage from './features/invoices/InvoiceDetailPage'
import NewInvoicePage from './features/invoices/NewInvoicePage'
import SettingsPage from './features/settings/SettingsPage'
import ReportsPage from './features/reports/ReportsPage'
import TemplateSelectPage from './features/templates/TemplateSelectPage'
import TemplateEditorPage from './features/templates/TemplateEditorPage'
import CustomerListPage from './features/customers/CustomerListPage'
import ProductListPage from './features/products/ProductListPage'
import PlansPage from './features/plans/PlansPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1
    }
  }
})

function AuthenticatedApp() {
  return (
    <AppLayout>
      <Switch>
        <Route exact path="/home" component={HomePage} />
        <Route exact path="/invoices" component={InvoiceListPage} />
        <Route exact path="/invoices/new" component={NewInvoicePage} />
        <Route exact path="/invoices/:id/pdf" render={({ match }) => <Redirect to={`/invoices/${match.params.id}`} />} />
        <Route exact path="/invoices/:id" component={InvoiceDetailPage} />
        <Route exact path="/customers" component={CustomerListPage} />
        <Route exact path="/products" component={ProductListPage} />
        <Route exact path="/settings" component={SettingsPage} />
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

function App() {
  const token = useAuthStore((state) => state.token)

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {!token ? (
          <Switch>
            <Route exact path="/" component={LandingPage} />
            <Route exact path="/demo" component={DemoPage} />
            <Route exact path="/auth/phone" component={PhonePage} />
            <Route exact path="/auth/verify" component={VerifyOTPPage} />
            <Redirect to="/" />
          </Switch>
        ) : (
          <AuthenticatedApp />
        )}
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
