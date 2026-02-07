import { useHistory } from 'react-router-dom'
import { CheckCircle, Palette, Loader2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { templateApi } from '../../lib/api'
import { PageHeader } from '../../components/layout'

export default function TemplateSelectPage() {
  const history = useHistory()
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
    }
  })

  const isLoading = templatesLoading || configLoading

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="Choose Template"
        subtitle="Select a template for your invoices. You can customize colors and visibility in the editor."
        backTo="/settings"
      />

      <div className="space-y-4">
        {templates?.map((template) => {
          const isSelected = currentConfig?.baseTemplateId === template.id
          return (
            <button
              key={template.id}
              onClick={() => selectMutation.mutate(template.id)}
              className={`w-full bg-bgSecondary rounded-xl border-2 shadow-card p-5 flex items-start gap-4 text-left transition-all hover:shadow-soft ${
                isSelected ? 'border-primary' : 'border-transparent hover:border-border'
              }`}
            >
              <div className="w-20 h-24 bg-bgPrimary rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                {template.previewImageUrl ? (
                  <img src={template.previewImageUrl} alt={template.name} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <Palette className="w-8 h-8 text-textSecondary/40" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-textPrimary">{template.name}</h3>
                  {isSelected && <CheckCircle className="w-4 h-4 text-primary" />}
                </div>
                {template.description && (
                  <p className="text-sm text-textSecondary">{template.description}</p>
                )}
                {isSelected && (
                  <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">Current</span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {currentConfig?.baseTemplateId && (
        <button
          onClick={() => history.push('/templates/editor')}
          className="w-full mt-6 bg-bgSecondary rounded-xl border border-border shadow-card p-6 text-center hover:bg-bgPrimary/30 transition-colors"
        >
          <Palette className="w-6 h-6 text-primary mx-auto mb-2" />
          <div className="text-sm font-semibold text-textPrimary">Customize Template</div>
          <p className="text-xs text-textSecondary mt-1">Change colors, visibility, and labels</p>
        </button>
      )}
    </div>
  )
}
