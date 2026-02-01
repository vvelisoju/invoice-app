import { IonApp, IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/react'
import { IonReactRouter } from '@ionic/react-router'
import { Route, Redirect } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

console.log('App-debug: Starting...')

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1
    }
  }
})

console.log('App-debug: QueryClient created')

function TestPage() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Test Page</h1>
      <p>Router is working!</p>
    </div>
  )
}

function App() {
  console.log('App-debug: Rendering...')
  
  return (
    <QueryClientProvider client={queryClient}>
      <IonApp>
        <IonReactRouter>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Invoice App - Debug Mode</IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <h1>Invoice App Loading...</h1>
            <p>If you see this, Ionic React Router is working!</p>
            <Route exact path="/test" component={TestPage} />
            <Route exact path="/">
              <div>
                <h2>Home Route</h2>
                <p>Current path: {window.location.pathname}</p>
              </div>
            </Route>
          </IonContent>
        </IonReactRouter>
      </IonApp>
    </QueryClientProvider>
  )
}

console.log('App-debug: Component defined')

export default App
