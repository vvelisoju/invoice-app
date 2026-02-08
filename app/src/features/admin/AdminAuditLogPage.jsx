import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '../../lib/api'
import { ScrollText, Search, Filter } from 'lucide-react'

const ACTION_BADGE = {
  CREATE: 'bg-green-100 text-green-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
  ISSUE: 'bg-purple-100 text-purple-700',
}

export default function AdminAuditLogPage() {
  const [entityType, setEntityType] = useState('')
  const [action, setAction] = useState('')
  const [page, setPage] = useState(0)
  const limit = 50

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'audit-logs', { entityType, action, offset: page * limit }],
    queryFn: () => adminApi.listAuditLogs({
      entityType: entityType || undefined,
      action: action || undefined,
      limit,
      offset: page * limit
    }).then(r => r.data.data),
    keepPreviousData: true
  })

  const logs = data?.logs || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / limit)

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-sm text-gray-500 mt-1">{total} total entries</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={entityType}
          onChange={(e) => { setEntityType(e.target.value); setPage(0) }}
          className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Entity Types</option>
          <option value="Invoice">Invoice</option>
          <option value="Customer">Customer</option>
          <option value="Product">Product</option>
          <option value="Business">Business</option>
          <option value="User">User</option>
        </select>
        <select
          value={action}
          onChange={(e) => { setAction(e.target.value); setPage(0) }}
          className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Actions</option>
          <option value="CREATE">Create</option>
          <option value="UPDATE">Update</option>
          <option value="DELETE">Delete</option>
          <option value="ISSUE">Issue</option>
        </select>
      </div>

      {/* Log List */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(10)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />)}
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <ScrollText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No audit logs found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {logs.map((log) => (
            <div key={log.id} className="p-3 md:p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${ACTION_BADGE[log.action] || 'bg-gray-100 text-gray-600'}`}>
                      {log.action}
                    </span>
                    <span className="text-xs font-medium text-gray-900">{log.entityType}</span>
                    <span className="text-[10px] text-gray-400 font-mono truncate">{log.entityId}</span>
                  </div>
                  {log.userId && (
                    <p className="text-[10px] text-gray-500 mt-1">
                      User: <span className="font-mono">{log.userId}</span>
                      {log.businessId && <> · Business: <span className="font-mono">{log.businessId}</span></>}
                    </p>
                  )}
                </div>
                <span className="text-[10px] text-gray-400 whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString('en-IN', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              </div>
              {log.changes && (
                <details className="mt-2">
                  <summary className="text-[10px] text-blue-600 cursor-pointer hover:underline">View changes</summary>
                  <pre className="mt-1 text-[10px] bg-gray-50 p-2 rounded overflow-x-auto text-gray-600">
                    {JSON.stringify(log.changes, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
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
