import {
  IonApp,
  IonRouterOutlet,
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel
} from '@ionic/react'
import { IonReactRouter } from '@ionic/react-router'
import { Route, Redirect } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { homeOutline, documentTextOutline, statsChartOutline, settingsOutline } from 'ionicons/icons'
import { useAuthStore } from './store/authStore'

import PhonePage from './features/auth/PhonePage'
import VerifyOTPPage from './features/auth/VerifyOTPPage'
import HomePage from './features/home/HomePage'
import InvoiceListPage from './features/invoices/InvoiceListPage'
import InvoiceDetailPage from './features/invoices/InvoiceDetailPage'
import NewInvoicePage from './features/invoices/NewInvoicePage'
import InvoicePDFPage from './features/invoices/InvoicePDFPage'
import SettingsPage from './features/settings/SettingsPage'
import ReportsPage from './features/reports/ReportsPage'
import TemplateSelectPage from './features/templates/TemplateSelectPage'
import TemplateEditorPage from './features/templates/TemplateEditorPage'

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
    <IonTabs>
      <IonRouterOutlet>
        <Route exact path="/home" component={HomePage} />
        <Route exact path="/invoices" component={InvoiceListPage} />
        <Route exact path="/invoices/new" component={NewInvoicePage} />
        <Route exact path="/invoices/:id" component={InvoiceDetailPage} />
        <Route exact path="/invoices/:id/pdf" component={InvoicePDFPage} />
        <Route exact path="/settings" component={SettingsPage} />
        <Route exact path="/reports" component={ReportsPage} />
        <Route exact path="/templates" component={TemplateSelectPage} />
        <Route exact path="/templates/editor" component={TemplateEditorPage} />
        <Route exact path="/">
          <Redirect to="/home" />
        </Route>
      </IonRouterOutlet>

      <IonTabBar slot="bottom">
        <IonTabButton tab="home" href="/home">
          <IonIcon icon={homeOutline} />
          <IonLabel>Home</IonLabel>
        </IonTabButton>
        <IonTabButton tab="invoices" href="/invoices">
          <IonIcon icon={documentTextOutline} />
          <IonLabel>Invoices</IonLabel>
        </IonTabButton>
        <IonTabButton tab="reports" href="/reports">
          <IonIcon icon={statsChartOutline} />
          <IonLabel>Reports</IonLabel>
        </IonTabButton>
        <IonTabButton tab="settings" href="/settings">
          <IonIcon icon={settingsOutline} />
          <IonLabel>Settings</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  )
}

function App() {
  const token = useAuthStore((state) => state.token)

  return (
    <QueryClientProvider client={queryClient}>
      <IonApp>
        <IonReactRouter>
          <IonRouterOutlet>
            <Route exact path="/auth/phone" component={PhonePage} />
            <Route exact path="/auth/verify" component={VerifyOTPPage} />
            <Route exact path="/" render={() => (
              token ? <AuthenticatedApp /> : <Redirect to="/auth/phone" />
            )} />
          </IonRouterOutlet>
        </IonReactRouter>
      </IonApp>
    </QueryClientProvider>
  )
}

export default App
