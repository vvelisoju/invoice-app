import { useParams, useHistory } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../lib/api'
import {
  ArrowLeft, User, Building2, Shield, CheckCircle, AlertTriangle, Ban,
  Phone, Mail, Calendar, Key
} from 'lucide-react'

const STATUS_BADGE = {
  ACTIVE: 'bg-green-100 text-green-700',
  SUSPENDED: 'bg-yellow-100 text-yellow-700',
  BANNED: 'bg-red-100 text-red-700',
}

const ROLE_BADGE = {
  USER: 'bg-gray-100 text-gray-600',
  SUPER_ADMIN: 'bg-blue-100 text-blue-700',
}

function InfoRow({ label, value, icon: Icon }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-500 flex items-center gap-1.5">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </span>
      <span className="text-xs font-medium text-gray-900 text-right">{value || '—'}</span>
    </div>
  )
}

export default function AdminUserDetailPage() {
  const { id } = useParams()
  const history = useHistory()
  const queryClient = useQueryClient()

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['admin', 'user', id],
    queryFn: () => adminApi.getUserDetails(id).then(r => r.data.data)
  })

  const statusMutation = useMutation({
    mutationFn: (status) => adminApi.updateUserStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin', 'user', id])
      queryClient.invalidateQueries(['admin', 'users'])
    }
  })

  const roleMutation = useMutation({
    mutationFn: (role) => adminApi.updateUserRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin', 'user', id])
      queryClient.invalidateQueries(['admin', 'users'])
    }
  })

  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-32" />
          <div className="h-40 bg-gray-200 rounded-xl" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm">
          Failed to load user: {error.message}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => history.push('/admin/users')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
            {(user.name || user.phone)?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900">{user.name || 'Unnamed User'}</h1>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${ROLE_BADGE[user.role]}`}>
                {user.role === 'SUPER_ADMIN' ? 'Admin' : 'User'}
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_BADGE[user.status]}`}>
                {user.status}
              </span>
            </div>
            <p className="text-xs text-gray-500">{user.phone}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {user.status === 'ACTIVE' && user.role !== 'SUPER_ADMIN' && (
          <button
            onClick={() => statusMutation.mutate('SUSPENDED')}
            disabled={statusMutation.isLoading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100"
          >
            <AlertTriangle className="w-3.5 h-3.5" /> Suspend
          </button>
        )}
        {user.status === 'SUSPENDED' && (
          <>
            <button
              onClick={() => statusMutation.mutate('ACTIVE')}
              disabled={statusMutation.isLoading}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100"
            >
              <CheckCircle className="w-3.5 h-3.5" /> Activate
            </button>
            <button
              onClick={() => statusMutation.mutate('BANNED')}
              disabled={statusMutation.isLoading}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100"
            >
              <Ban className="w-3.5 h-3.5" /> Ban
            </button>
          </>
        )}
        {user.status === 'BANNED' && (
          <button
            onClick={() => statusMutation.mutate('ACTIVE')}
            disabled={statusMutation.isLoading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100"
          >
            <CheckCircle className="w-3.5 h-3.5" /> Reactivate
          </button>
        )}
        {user.role === 'USER' && (
          <button
            onClick={() => {
              if (window.confirm('Promote this user to Super Admin?')) {
                roleMutation.mutate('SUPER_ADMIN')
              }
            }}
            disabled={roleMutation.isLoading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
          >
            <Shield className="w-3.5 h-3.5" /> Make Admin
          </button>
        )}
        {user.role === 'SUPER_ADMIN' && (
          <button
            onClick={() => {
              if (window.confirm('Demote this admin to regular user?')) {
                roleMutation.mutate('USER')
              }
            }}
            disabled={roleMutation.isLoading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100"
          >
            <User className="w-3.5 h-3.5" /> Remove Admin
          </button>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* User Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" /> User Info
          </h3>
          <InfoRow label="Name" value={user.name} icon={User} />
          <InfoRow label="Phone" value={user.phone} icon={Phone} />
          <InfoRow label="Email" value={user.email} icon={Mail} />
          <InfoRow label="Role" value={user.role} icon={Shield} />
          <InfoRow label="Status" value={user.status} />
          <InfoRow label="OTP Verified" value={user.otpVerifiedAt ? new Date(user.otpVerifiedAt).toLocaleString('en-IN') : 'Never'} icon={Key} />
          <InfoRow label="Joined" value={new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} icon={Calendar} />
          <InfoRow label="Last Updated" value={new Date(user.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} />
        </div>

        {/* Businesses */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-gray-400" /> Businesses ({user.businesses?.length || 0})
          </h3>
          {user.businesses?.length > 0 ? (
            <div className="space-y-3">
              {user.businesses.map(biz => (
                <div
                  key={biz.id}
                  className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => history.push(`/admin/businesses/${biz.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900">{biz.name}</h4>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_BADGE[biz.status] || 'bg-gray-100 text-gray-600'}`}>
                      {biz.status}
                    </span>
                  </div>
                  <div className="flex gap-3 mt-1 text-[10px] text-gray-500">
                    <span>Plan: {biz.plan?.displayName || 'Free'}</span>
                    <span>{biz._count?.invoices || 0} invoices</span>
                    <span>{biz._count?.customers || 0} customers</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 text-center py-4">No businesses</p>
          )}
        </div>
      </div>

      {/* Recent OTP Requests */}
      {user.otpRequests?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent OTP Requests</h3>
          <div className="space-y-2">
            {user.otpRequests.map((otp) => (
              <div key={otp.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${otp.verified ? 'bg-green-400' : 'bg-gray-300'}`} />
                  <span className="text-xs text-gray-600">{otp.phone}</span>
                </div>
                <span className="text-[10px] text-gray-400">
                  {new Date(otp.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
