import { useHistory } from 'react-router-dom'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardContent,
  IonIcon,
  IonText,
  IonSpinner,
  IonBadge,
  useIonToast
} from '@ionic/react'
import { checkmarkCircle, colorPaletteOutline } from 'ionicons/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { templateApi } from '../../lib/api'

export default function TemplateSelectPage() {
  const history = useHistory()
  const [present] = useIonToast()
  const queryClient = useQueryClient()

  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['templates', 'base'],
    queryFn: async () => {
      const response = await templateApi.listBase()
      return response.data.data || response.data
    }
  })

  const { data: currentConfig, isLoading: configLoading } = useQuery({
    queryKey: ['templates', 'config'],
    queryFn: async () => {
      const response = await templateApi.getConfig()
      return response.data.data || response.data
    }
  })

  const selectMutation = useMutation({
    mutationFn: (baseTemplateId) => templateApi.updateConfig({ baseTemplateId }),
    onSuccess: () => {
      queryClient.invalidateQueries(['templates', 'config'])
      present({
        message: 'Template selected',
        duration: 2000,
        color: 'success'
      })
    },
    onError: (error) => {
      present({
        message: error.response?.data?.error?.message || 'Failed to select template',
        duration: 3000,
        color: 'danger'
      })
    }
  })

  const isLoading = templatesLoading || configLoading

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/settings" />
          </IonButtons>
          <IonTitle>Choose Template</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <IonSpinner />
          </div>
        ) : (
          <>
            <IonText color="medium">
              <p style={{ marginBottom: '20px' }}>
                Select a template for your invoices. You can customize colors and visibility in the editor.
              </p>
            </IonText>

            <div style={{ display: 'grid', gap: '16px' }}>
              {templates?.map((template) => {
                const isSelected = currentConfig?.baseTemplateId === template.id
                return (
                  <IonCard
                    key={template.id}
                    button
                    onClick={() => selectMutation.mutate(template.id)}
                    style={{
                      margin: 0,
                      border: isSelected ? '2px solid var(--ion-color-primary)' : '2px solid transparent'
                    }}
                  >
                    <IonCardContent>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                        {/* Preview */}
                        <div style={{
                          width: '80px',
                          height: '100px',
                          background: '#f5f5f5',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {template.previewImageUrl ? (
                            <img
                              src={template.previewImageUrl}
                              alt={template.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }}
                            />
                          ) : (
                            <IonIcon icon={colorPaletteOutline} style={{ fontSize: '32px', color: '#999' }} />
                          )}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <h3 style={{ margin: 0, fontWeight: '600' }}>{template.name}</h3>
                            {isSelected && (
                              <IonIcon icon={checkmarkCircle} color="primary" />
                            )}
                          </div>
                          {template.description && (
                            <IonText color="medium">
                              <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>{template.description}</p>
                            </IonText>
                          )}
                          {isSelected && (
                            <IonBadge color="primary" style={{ marginTop: '8px' }}>
                              Current
                            </IonBadge>
                          )}
                        </div>
                      </div>
                    </IonCardContent>
                  </IonCard>
                )
              })}
            </div>

            {/* Customize Button */}
            {currentConfig?.baseTemplateId && (
              <div style={{ marginTop: '24px' }}>
                <IonCard
                  button
                  onClick={() => history.push('/templates/editor')}
                  style={{ margin: 0 }}
                >
                  <IonCardContent style={{ textAlign: 'center' }}>
                    <IonIcon icon={colorPaletteOutline} style={{ fontSize: '24px', marginBottom: '8px' }} />
                    <div style={{ fontWeight: '600' }}>Customize Template</div>
                    <IonText color="medium">
                      <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>
                        Change colors, visibility, and labels
                      </p>
                    </IonText>
                  </IonCardContent>
                </IonCard>
              </div>
            )}
          </>
        )}
      </IonContent>
    </IonPage>
  )
}
