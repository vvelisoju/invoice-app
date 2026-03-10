import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../lib/api'
import {
  Search, Globe, ChevronDown, ChevronUp, Phone, User,
  MessageSquare, Calendar, Filter, X, ExternalLink
} from 'lucide-react'
import { format } from 'date-fns'

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'converted', label: 'Converted' },
  { value: 'closed', label: 'Closed' },
]

const SOURCE_OPTIONS = [
  { value: '', label: 'All Sources' },
  { value: 'ignitelabs', label: 'Ignite Labs' },
]

const STATUS_BADGE = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  converted: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-500',
}

const SOURCE_BADGE = {
  ignitelabs: 'bg-orange-100 text-orange-700',
}

const STATUS_TRANSITIONS = {
  new: ['contacted', 'closed'],
  contacted: ['converted', 'closed'],
  converted: ['closed'],
  closed: [],
}

export default function AdminExternalEnquiriesPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [source, setSource] = useState('')
  const [page, setPage] = useState(0)
  const [expandedId, setExpandedId] = useState(null)
  const [editingNotes, setEditingNotes] = useState({})
  const limit = 20

  // Fetch enquiries
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'external-enquiries', { search, status, source, offset: page * limit }],
    queryFn: () => adminApi.listExternalEnquiries({
      search: search || undefined,
      status: status || undefined,
      source: source || undefined,
      limit,
      offset: page * limit,
    }).then(r => r.data),
    keepPreviousData: true,
  })

  // Fetch stats
  const { data: statsData } = useQuery({
    queryKey: ['admin', 'external-enquiries', 'stats'],
    queryFn: () => adminApi.getExternalEnquiryStats().then(r => r.data.data),
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminApi.updateExternalEnquiry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin', 'external-enquiries'])
    },
  })

  const enquiries = data?.data || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / limit)

  const handleStatusChange = (id, newStatus) => {
    updateMutation.mutate({ id, data: { status: newStatus } })
  }

  const handleNotesSave = (id) => {
    const notes = editingNotes[id]
    if (notes !== undefined) {
      updateMutation.mutate({ id, data: { notes } })
      setEditingNotes(prev => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    }
  }

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Globe className="w-6 h-6 text-blue-500" />
          External Enquiries
        </h1>
        <p className="text-sm text-gray-500 mt-1">{total} total enquiries from external websites</p>
      </div>

      {/* Stats Cards */}
      {statsData && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-white border border-gray-200 rounded-xl p-3">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-xl font-bold text-gray-900">{statsData.total || 0}</p>
          </div>
          {['new', 'contacted', 'converted', 'closed'].map(s => (
            <div key={s} className="bg-white border border-gray-200 rounded-xl p-3">
              <p className="text-xs text-gray-500 capitalize">{s}</p>
              <p className={`text-xl font-bold ${s === 'new' ? 'text-blue-600' : s === 'contacted' ? 'text-yellow-600' : s === 'converted' ? 'text-green-600' : 'text-gray-500'}`}>
                {statsData.byStatus?.[s] || 0}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Source Badges */}
      {statsData?.bySource && Object.keys(statsData.bySource).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(statsData.bySource).map(([src, count]) => (
            <span
              key={src}
              className={`text-xs px-2.5 py-1 rounded-full font-medium ${SOURCE_BADGE[src] || 'bg-gray-100 text-gray-600'}`}
            >
              {src}: {count}
            </span>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, phone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={source}
          onChange={(e) => { setSource(e.target.value); setPage(0) }}
          className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {SOURCE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(0) }}
          className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : enquiries.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Globe className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No enquiries found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {enquiries.map((enquiry) => {
            const isExpanded = expandedId === enquiry.id
            const transitions = STATUS_TRANSITIONS[enquiry.status] || []

            return (
              <div
                key={enquiry.id}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 transition-colors"
              >
                {/* Main row */}
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => toggleExpand(enquiry.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {enquiry.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-semibold text-gray-900 text-sm truncate">{enquiry.name}</h3>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_BADGE[enquiry.status]}`}>
                              {enquiry.status}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${SOURCE_BADGE[enquiry.source] || 'bg-gray-100 text-gray-600'}`}>
                              {enquiry.source}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {enquiry.phone}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(enquiry.createdAt), 'dd MMM yyyy, h:mm a')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                        <span className="bg-gray-50 px-2 py-0.5 rounded">{enquiry.interestedIn}</span>
                        <span className="bg-gray-50 px-2 py-0.5 rounded">{enquiry.formType}</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-4">
                    {/* Message */}
                    {enquiry.message && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1">Message</label>
                        <p className="text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-200">
                          {enquiry.message}
                        </p>
                      </div>
                    )}

                    {/* Extra Data */}
                    {enquiry.extraData && Object.keys(enquiry.extraData).length > 0 && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1">Extra Data</label>
                        <pre className="text-xs text-gray-600 bg-white p-3 rounded-lg border border-gray-200 overflow-x-auto">
                          {JSON.stringify(enquiry.extraData, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* Status Update */}
                    {transitions.length > 0 && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1">Update Status</label>
                        <div className="flex flex-wrap gap-2">
                          {transitions.map(s => (
                            <button
                              key={s}
                              onClick={() => handleStatusChange(enquiry.id, s)}
                              disabled={updateMutation.isLoading}
                              className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors ${
                                s === 'contacted' ? 'border-yellow-300 text-yellow-700 hover:bg-yellow-50' :
                                s === 'converted' ? 'border-green-300 text-green-700 hover:bg-green-50' :
                                'border-gray-300 text-gray-600 hover:bg-gray-100'
                              }`}
                            >
                              Mark as {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1">Admin Notes</label>
                      <textarea
                        value={editingNotes[enquiry.id] !== undefined ? editingNotes[enquiry.id] : (enquiry.notes || '')}
                        onChange={(e) => setEditingNotes(prev => ({ ...prev, [enquiry.id]: e.target.value }))}
                        placeholder="Add follow-up notes..."
                        rows={3}
                        className="w-full text-sm border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                      {editingNotes[enquiry.id] !== undefined && (
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleNotesSave(enquiry.id)}
                            disabled={updateMutation.isLoading}
                            className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Save Notes
                          </button>
                          <button
                            onClick={() => setEditingNotes(prev => {
                              const next = { ...prev }
                              delete next[enquiry.id]
                              return next
                            })}
                            className="text-xs px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Phone action */}
                    <a
                      href={`tel:${enquiry.phone}`}
                      className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      Call {enquiry.name}
                    </a>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-gray-500">
            Showing {page * limit + 1}–{Math.min((page + 1) * limit, total)} of {total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 text-xs border rounded-lg disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 text-xs border rounded-lg disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
