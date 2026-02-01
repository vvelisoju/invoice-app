import { IonApp, IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/react'

function App() {
  return (
    <IonApp>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Invoice App - Test</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <h1>Invoice App is Loading!</h1>
        <p>If you see this, React and Ionic are working.</p>
      </IonContent>
    </IonApp>
  )
}

export default App
