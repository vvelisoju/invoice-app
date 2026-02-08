import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useHistory } from 'react-router-dom'
import { adminApi } from '../../lib/api'
import {
  Search, Users, ChevronRight, Shield, Ban, CheckCircle, AlertTriangle
} from 'lucide-react'

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'BANNED', label: 'Banned' },
]

const ROLE_OPTIONS = [
  { value: '', label: 'All Roles' },
  { value: 'USER', label: 'User' },
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
]

const STATUS_BADGE = {
  ACTIVE: 'bg-green-100 text-green-700',
  SUSPENDED: 'bg-yellow-100 text-yellow-700',
  BANNED: 'bg-red-100 text-red-700',
}

const ROLE_BADGE = {
  USER: 'bg-gray-100 text-gray-600',
  SUPER_ADMIN: 'bg-blue-100 text-blue-700',
}

export default function AdminUserListPage() {
  const history = useHistory()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [role, setRole] = useState('')
  const [page, setPage] = useState(0)
  const limit = 20

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', { search, status, role, offset: page * limit }],
    queryFn: () => adminApi.listUsers({
      search: search || undefined,
      status: status || undefined,
      role: role || undefined,
      limit,
      offset: page * limit
    }).then(r => r.data.data),
    keepPreviousData: true
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => adminApi.updateUserStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries(['admin', 'users'])
  })

  const users = data?.users || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / limit)

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-sm text-gray-500 mt-1">{total} total users</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, phone, email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={role}
          onChange={(e) => { setRole(e.target.value); setPage(0) }}
          className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {ROLE_OPTIONS.map(opt => (
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
          {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No users found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((user) => (
            <div
              key={user.id}
              className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => history.push(`/admin/users/${user.id}`)}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {(user.name || user.phone)?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-semibold text-gray-900 text-sm">{user.name || 'Unnamed'}</h3>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${ROLE_BADGE[user.role]}`}>
                          {user.role === 'SUPER_ADMIN' ? 'Admin' : 'User'}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_BADGE[user.status]}`}>
                          {user.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{user.phone} {user.email ? `· ${user.email}` : ''}</p>
                    </div>
                  </div>
                  {user.businesses?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {user.businesses.map(biz => (
                        <span key={biz.id} className="text-[10px] bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full text-gray-600">
                          {biz.name} · {biz.plan?.displayName || 'Free'} · {biz._count?.invoices || 0} inv
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {user.status === 'ACTIVE' && user.role !== 'SUPER_ADMIN' && (
                    <button
                      onClick={() => statusMutation.mutate({ id: user.id, status: 'SUSPENDED' })}
                      className="p-2 text-yellow-500 hover:bg-yellow-50 rounded-lg"
                      title="Suspend"
                    >
                      <AlertTriangle className="w-4 h-4" />
                    </button>
                  )}
                  {user.status === 'SUSPENDED' && (
                    <button
                      onClick={() => statusMutation.mutate({ id: user.id, status: 'ACTIVE' })}
                      className="p-2 text-green-500 hover:bg-green-50 rounded-lg"
                      title="Activate"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => history.push(`/admin/users/${user.id}`)}
                    className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
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
