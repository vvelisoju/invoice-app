import { useState, useMemo } from 'react'
import { X, Check, Loader2, Palette } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { templateApi } from '../../../lib/api'
import { TEMPLATE_REGISTRY, COLOR_FAMILIES, getTemplateList } from '../utils/templates/registry'

export default function TemplateSelectModal({ isOpen, onClose, onTemplateChange }) {
  const queryClient = useQueryClient()
  const [colorFilter, setColorFilter] = useState('all')

  // Fetch current business template config
  const { data: currentConfig, isLoading: configLoading } = useQuery({
    queryKey: ['templates', 'config'],
    queryFn: async () => {
      const response = await templateApi.getConfig()
      return response.data.data || response.data
    },
    enabled: isOpen
  })

  // Fetch base templates from server
  const { data: serverTemplates, isLoading: templatesLoading } = useQuery({
    queryKey: ['templates', 'base'],
    queryFn: async () => {
      const response = await templateApi.listBase()
      return response.data.data || response.data || []
    },
    enabled: isOpen
  })

  // Merge server templates with client registry for display
  const templates = useMemo(() => {
    const clientTemplates = getTemplateList()
    if (!serverTemplates?.length) return clientTemplates

    // Match server templates to client registry by name
    return clientTemplates.map(ct => {
      const serverMatch = serverTemplates.find(st => st.name === ct.id)
      return {
        ...ct,
        serverId: serverMatch?.id || null,
        serverDescription: serverMatch?.description || ct.description,
      }
    }).filter(t => {
      // Only show templates that exist on server
      return serverTemplates.some(st => st.name === t.id)
    })
  }, [serverTemplates])

  // Filter by color
  const filteredTemplates = useMemo(() => {
    if (colorFilter === 'all') return templates
    return templates.filter(t => t.colorFamily === colorFilter)
  }, [templates, colorFilter])

  // Determine currently selected template
  const currentTemplateId = useMemo(() => {
    if (!currentConfig?.baseTemplateId || !serverTemplates?.length) return 'clean'
    const match = serverTemplates.find(st => st.id === currentConfig.baseTemplateId)
    return match?.name || 'clean'
  }, [currentConfig, serverTemplates])

  // Select template mutation
  const selectMutation = useMutation({
    mutationFn: async (templateId) => {
      // Find server ID for this template
      const serverTemplate = serverTemplates?.find(st => st.name === templateId)
      if (!serverTemplate) throw new Error('Template not found on server')
      await templateApi.updateConfig({ baseTemplateId: serverTemplate.id })
      return templateId
    },
    onSuccess: (templateId) => {
      queryClient.invalidateQueries({ queryKey: ['templates', 'config'] })
      onTemplateChange?.(templateId)
      onClose()
    }
  })

  if (!isOpen) return null

  const isLoading = configLoading || templatesLoading

  // Template color preview swatch
  const TEMPLATE_PREVIEW_COLORS = {
    clean: { bg: '#FFFFFF', accent: '#1F2937', headerBg: '#F9FAFB' },
    'modern-red': { bg: '#FFFFFF', accent: '#DC2626', headerBg: '#FEF2F2' },
    'classic-red': { bg: '#FFFFFF', accent: '#047857', headerBg: '#ECFDF5' },
    wexler: { bg: '#FFFFFF', accent: '#1E3A5F', headerBg: '#1E3A5F' },
    plexer: { bg: '#FFFFFF', accent: '#374151', headerBg: '#F3F4F6' },
    contemporary: { bg: '#FFFFFF', accent: '#E11D48', headerBg: '#E11D48' },
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-bold text-textPrimary flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              Select Template
            </h2>
            <p className="text-xs text-textSecondary mt-0.5">Choose a template for your invoice PDF</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-bgPrimary text-textSecondary hover:text-textPrimary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Color Filter */}
        <div className="px-6 py-3 border-b border-border flex items-center gap-3 shrink-0">
          <span className="text-xs font-medium text-textSecondary">Filter by Color</span>
          <div className="flex items-center gap-1.5">
            {COLOR_FAMILIES.map(cf => (
              <button
                key={cf.key}
                onClick={() => setColorFilter(cf.key)}
                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                  colorFilter === cf.key
                    ? 'border-primary scale-110 shadow-sm'
                    : 'border-transparent hover:border-gray-300'
                }`}
                style={cf.color ? { backgroundColor: cf.color } : { backgroundColor: '#F3F4F6' }}
                title={cf.label}
              >
                {colorFilter === cf.key && (
                  <Check className={`w-3.5 h-3.5 ${cf.color ? 'text-white' : 'text-gray-600'}`} />
                )}
                {cf.key === 'all' && colorFilter !== 'all' && (
                  <span className="text-[9px] font-bold text-gray-500">All</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Template Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-7 h-7 text-primary animate-spin" />
              <p className="text-sm text-textSecondary">Loading templates...</p>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm text-textSecondary">No templates match this filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filteredTemplates.map(template => {
                const isSelected = currentTemplateId === template.id
                const colors = TEMPLATE_PREVIEW_COLORS[template.id] || TEMPLATE_PREVIEW_COLORS.clean
                const isSelecting = selectMutation.isPending && selectMutation.variables === template.id

                return (
                  <button
                    key={template.id}
                    onClick={() => {
                      if (!isSelected && !selectMutation.isPending) {
                        selectMutation.mutate(template.id)
                      }
                    }}
                    disabled={selectMutation.isPending}
                    className={`group relative rounded-xl border-2 overflow-hidden text-left transition-all hover:shadow-lg ${
                      isSelected
                        ? 'border-primary shadow-md ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/40'
                    } ${selectMutation.isPending && !isSelecting ? 'opacity-50' : ''}`}
                  >
                    {/* Mini Preview */}
                    <div className="aspect-[3/4] bg-gray-50 p-3 relative">
                      {/* Simplified template preview */}
                      <div className="w-full h-full bg-white rounded shadow-sm overflow-hidden flex flex-col">
                        {/* Header area */}
                        <div
                          className="h-[18%] flex items-center px-2"
                          style={{ backgroundColor: colors.headerBg }}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span
                              className="text-[7px] font-bold tracking-wider"
                              style={{ color: colors.headerBg === colors.accent ? '#FFFFFF' : colors.accent }}
                            >
                              INVOICE
                            </span>
                            <div className="flex flex-col items-end gap-0.5">
                              <div className="w-8 h-1 rounded-full" style={{ backgroundColor: colors.accent, opacity: 0.3 }} />
                              <div className="w-6 h-1 rounded-full" style={{ backgroundColor: colors.accent, opacity: 0.2 }} />
                            </div>
                          </div>
                        </div>
                        {/* Address area */}
                        <div className="px-2 py-1.5 flex gap-2">
                          <div className="flex-1">
                            <div className="w-10 h-1 rounded-full bg-gray-300 mb-1" />
                            <div className="w-14 h-0.5 rounded-full bg-gray-200 mb-0.5" />
                            <div className="w-12 h-0.5 rounded-full bg-gray-200" />
                          </div>
                          <div className="flex-1">
                            <div className="w-8 h-1 rounded-full bg-gray-300 mb-1" />
                            <div className="w-12 h-0.5 rounded-full bg-gray-200 mb-0.5" />
                            <div className="w-10 h-0.5 rounded-full bg-gray-200" />
                          </div>
                        </div>
                        {/* Table area */}
                        <div className="px-2 flex-1">
                          <div className="h-[1px] mb-1" style={{ backgroundColor: colors.accent, opacity: 0.3 }} />
                          {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-center gap-1 mb-1">
                              <div className="flex-1 h-0.5 rounded-full bg-gray-200" />
                              <div className="w-4 h-0.5 rounded-full bg-gray-200" />
                              <div className="w-5 h-0.5 rounded-full bg-gray-300" />
                            </div>
                          ))}
                        </div>
                        {/* Total area */}
                        <div className="px-2 pb-2 flex justify-end">
                          <div className="flex items-center gap-1">
                            <div className="w-6 h-1 rounded-full" style={{ backgroundColor: colors.accent, opacity: 0.5 }} />
                            <div className="w-8 h-1.5 rounded-full" style={{ backgroundColor: colors.accent }} />
                          </div>
                        </div>
                      </div>

                      {/* Selected badge */}
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}

                      {/* Loading overlay */}
                      {isSelecting && (
                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                          <Loader2 className="w-5 h-5 text-primary animate-spin" />
                        </div>
                      )}
                    </div>

                    {/* Label */}
                    <div className="px-3 py-2.5 bg-white border-t border-border/50">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: template.previewColor }}
                        />
                        <span className="text-xs font-semibold text-textPrimary truncate">
                          {template.name}
                        </span>
                      </div>
                      <p className="text-[10px] text-textSecondary mt-0.5 line-clamp-1 pl-5">
                        {template.description}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
