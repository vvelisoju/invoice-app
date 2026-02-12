import { useState, useMemo } from 'react'
import { useHistory } from 'react-router-dom'
import { CheckCircle, Palette, Loader2, Check, LayoutGrid } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { templateApi } from '../../lib/api'
import { PageHeader } from '../../components/layout'
import { TEMPLATE_REGISTRY, COLOR_FAMILIES, CATEGORIES, getTemplateList } from '../invoices/utils/templates/registry'

function getPreviewColors(template) {
  const accent = template.previewColor || '#374151'
  const isFullHeader = template.category === 'modern' || template.category === 'creative'
  return { bg: '#FFFFFF', accent, headerBg: isFullHeader ? accent : `${accent}12` }
}

const PAGE_SIZE = 24

export default function TemplateSelectPage() {
  const history = useHistory()
  const queryClient = useQueryClient()
  const [colorFilter, setColorFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [page, setPage] = useState(0)

  const { data: serverTemplates, isLoading: templatesLoading } = useQuery({
    queryKey: ['templates', 'base'],
    queryFn: async () => {
      const response = await templateApi.listBase()
      return response.data.data || response.data || []
    }
  })

  const { data: currentConfig, isLoading: configLoading } = useQuery({
    queryKey: ['templates', 'config'],
    queryFn: async () => {
      const response = await templateApi.getConfig()
      return response.data.data || response.data
    }
  })

  const templates = useMemo(() => {
    const clientTemplates = getTemplateList()
    if (!serverTemplates?.length) return clientTemplates
    return clientTemplates.map(ct => {
      const serverMatch = serverTemplates.find(st => st.name === ct.id)
      return { ...ct, serverId: serverMatch?.id || null }
    }).filter(t => serverTemplates.some(st => st.name === t.id))
  }, [serverTemplates])

  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      const catMatch = categoryFilter === 'all' || t.category === categoryFilter
      const colorMatch = colorFilter === 'all' || t.colorFamily === colorFilter
      return catMatch && colorMatch
    })
  }, [templates, colorFilter, categoryFilter])

  const pagedTemplates = useMemo(() => {
    const start = page * PAGE_SIZE
    return filteredTemplates.slice(start, start + PAGE_SIZE)
  }, [filteredTemplates, page])

  const totalPages = Math.ceil(filteredTemplates.length / PAGE_SIZE)

  const currentTemplateId = useMemo(() => {
    if (!currentConfig?.baseTemplateId || !serverTemplates?.length) return 'clean'
    const match = serverTemplates.find(st => st.id === currentConfig.baseTemplateId)
    return match?.name || 'clean'
  }, [currentConfig, serverTemplates])

  const selectMutation = useMutation({
    mutationFn: async (templateId) => {
      const serverTemplate = serverTemplates?.find(st => st.name === templateId)
      if (!serverTemplate) throw new Error('Template not found on server')
      await templateApi.updateConfig({ baseTemplateId: serverTemplate.id })
      return templateId
    },
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
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <PageHeader
        title="Choose Template"
        subtitle={`${filteredTemplates.length} templates available. Select a template for your invoices.`}
        backTo="/settings"
      />

      {/* Filters */}
      <div className="mb-6 space-y-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <LayoutGrid className="w-4 h-4 text-textSecondary shrink-0" />
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => { setCategoryFilter(cat.key); setPage(0) }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                categoryFilter === cat.key
                  ? 'bg-primary text-white'
                  : 'bg-bgPrimary text-textSecondary hover:bg-gray-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
        {/* Color Filter */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-textSecondary">Color</span>
          <div className="flex items-center gap-1.5">
            {COLOR_FAMILIES.map(cf => (
              <button
                key={cf.key}
                onClick={() => { setColorFilter(cf.key); setPage(0) }}
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
      </div>

      {/* Template Grid */}
      {pagedTemplates.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-textSecondary">No templates match this filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {pagedTemplates.map(template => {
            const isSelected = currentTemplateId === template.id
            const colors = getPreviewColors(template)
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
                <div className="aspect-[3/4] bg-gray-50 p-2 relative">
                  <div className="w-full h-full bg-white rounded shadow-sm overflow-hidden flex flex-col">
                    <div className="h-[18%] flex items-center px-2" style={{ backgroundColor: colors.headerBg }}>
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[6px] font-bold tracking-wider" style={{ color: colors.headerBg === colors.accent ? '#FFFFFF' : colors.accent }}>
                          INVOICE
                        </span>
                        <div className="flex flex-col items-end gap-0.5">
                          <div className="w-6 h-0.5 rounded-full" style={{ backgroundColor: colors.accent, opacity: 0.3 }} />
                          <div className="w-4 h-0.5 rounded-full" style={{ backgroundColor: colors.accent, opacity: 0.2 }} />
                        </div>
                      </div>
                    </div>
                    <div className="px-2 py-1 flex gap-1.5">
                      <div className="flex-1">
                        <div className="w-8 h-0.5 rounded-full bg-gray-300 mb-0.5" />
                        <div className="w-10 h-0.5 rounded-full bg-gray-200 mb-0.5" />
                        <div className="w-8 h-0.5 rounded-full bg-gray-200" />
                      </div>
                      <div className="flex-1">
                        <div className="w-6 h-0.5 rounded-full bg-gray-300 mb-0.5" />
                        <div className="w-9 h-0.5 rounded-full bg-gray-200 mb-0.5" />
                        <div className="w-7 h-0.5 rounded-full bg-gray-200" />
                      </div>
                    </div>
                    <div className="px-2 flex-1">
                      <div className="h-[1px] mb-0.5" style={{ backgroundColor: colors.accent, opacity: 0.3 }} />
                      {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center gap-0.5 mb-0.5">
                          <div className="flex-1 h-0.5 rounded-full bg-gray-200" />
                          <div className="w-3 h-0.5 rounded-full bg-gray-200" />
                          <div className="w-4 h-0.5 rounded-full bg-gray-300" />
                        </div>
                      ))}
                    </div>
                    <div className="px-2 pb-1.5 flex justify-end">
                      <div className="flex items-center gap-0.5">
                        <div className="w-5 h-0.5 rounded-full" style={{ backgroundColor: colors.accent, opacity: 0.5 }} />
                        <div className="w-6 h-1 rounded-full" style={{ backgroundColor: colors.accent }} />
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center shadow">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                  {isSelecting && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    </div>
                  )}
                </div>

                <div className="px-2.5 py-2 bg-white border-t border-border/50">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: template.previewColor }} />
                    <span className="text-[11px] font-semibold text-textPrimary truncate">{template.name}</span>
                  </div>
                  <p className="text-[9px] text-textSecondary mt-0.5 line-clamp-1 pl-4">{template.category}</p>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border text-textSecondary hover:bg-bgPrimary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-xs text-textSecondary">Page {page + 1} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border text-textSecondary hover:bg-bgPrimary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}

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
