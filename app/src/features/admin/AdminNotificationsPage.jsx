import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Send, History, Bell, Users, Building2, CreditCard, User,
  Globe, ChevronDown, AlertCircle, CheckCircle, Eye
} from 'lucide-react'
import { adminApi } from '../../lib/api'
import { useAdminNotifications, useSendNotification } from '../notifications/useNotifications'
import { formatDistanceToNow, format } from 'date-fns'

const TARGET_TYPES = [
  { value: 'ALL', label: 'All Users', icon: Globe, description: 'Send to every active user' },
  { value: 'PLAN', label: 'Specific Plan', icon: CreditCard, description: 'Users on a specific plan' },
  { value: 'BUSINESS', label: 'Specific Business', icon: Building2, description: 'A single business owner' },
  { value: 'USER', label: 'Specific User', icon: User, description: 'A single user' },
]

const TARGET_TYPE_LABELS = {
  ALL: 'All Users',
  PLAN: 'Plan',
  BUSINESS: 'Business',
  USER: 'User',
}

// ── Send Notification Tab ──────────────────────────────────────────────
function SendNotificationForm() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [targetType, setTargetType] = useState('ALL')
  const [targetId, setTargetId] = useState('')
  const [deepLinkRoute, setDeepLinkRoute] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [success, setSuccess] = useState(false)

  const sendNotification = useSendNotification()

  // Fetch plans/businesses/users for target selector
  const { data: plansData } = useQuery({
    queryKey: ['admin', 'plans-for-notif'],
    queryFn: () => adminApi.listPlans().then(r => r.data.data),
    enabled: targetType === 'PLAN',
    staleTime: 1000 * 60 * 5,
  })

  const { data: businessesData } = useQuery({
    queryKey: ['admin', 'businesses-for-notif'],
    queryFn: () => adminApi.listBusinesses({ limit: 100 }).then(r => r.data.data),
    enabled: targetType === 'BUSINESS',
    staleTime: 1000 * 60 * 5,
  })

  const { data: usersData } = useQuery({
    queryKey: ['admin', 'users-for-notif'],
    queryFn: () => adminApi.listUsers({ limit: 100 }).then(r => r.data.data),
    enabled: targetType === 'USER',
    staleTime: 1000 * 60 * 5,
  })

  const plans = plansData || []
  const businesses = businessesData?.businesses || []
  const users = usersData?.users || []

  const canSend = title.trim() && body.trim() && (targetType === 'ALL' || targetId)

  const handleSend = () => {
    if (!canSend) return
    const payload = {
      title: title.trim(),
      body: body.trim(),
      targetType,
      ...(targetType !== 'ALL' && { targetId }),
      ...(deepLinkRoute.trim() && {
        data: { action: 'navigate', route: deepLinkRoute.trim() }
      }),
    }

    sendNotification.mutate(payload, {
      onSuccess: () => {
        setSuccess(true)
        setTitle('')
        setBody('')
        setTargetId('')
        setDeepLinkRoute('')
        setShowConfirm(false)
        setTimeout(() => setSuccess(false), 3000)
      },
      onError: () => {
        setShowConfirm(false)
      },
    })
  }

  return (
    <div className="max-w-2xl">
      {success && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
          <CheckCircle className="w-4 h-4 shrink-0" />
          Notification sent successfully!
        </div>
      )}

      {sendNotification.isError && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {sendNotification.error?.response?.data?.error?.message || 'Failed to send notification'}
        </div>
      )}

      {/* Target Type */}
      <div className="mb-5">
        <label className="block text-sm font-semibold text-textPrimary mb-2">Target Audience</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {TARGET_TYPES.map((t) => {
            const Icon = t.icon
            const selected = targetType === t.value
            return (
              <button
                key={t.value}
                onClick={() => { setTargetType(t.value); setTargetId('') }}
                className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border text-xs font-medium transition-colors tap-target-auto ${
                  selected
                    ? 'border-primary bg-blue-50 text-primary'
                    : 'border-border bg-white text-textSecondary active:border-primary md:hover:border-primary'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Target Selector (conditional) */}
      {targetType === 'PLAN' && (
        <div className="mb-5">
          <label className="block text-sm font-semibold text-textPrimary mb-1.5">Select Plan</label>
          <div className="relative">
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-white appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">Choose a plan...</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>{p.displayName || p.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      )}

      {targetType === 'BUSINESS' && (
        <div className="mb-5">
          <label className="block text-sm font-semibold text-textPrimary mb-1.5">Select Business</label>
          <div className="relative">
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-white appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">Choose a business...</option>
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>{b.name} ({b.owner?.phone})</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      )}

      {targetType === 'USER' && (
        <div className="mb-5">
          <label className="block text-sm font-semibold text-textPrimary mb-1.5">Select User</label>
          <div className="relative">
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-white appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">Choose a user...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name || u.phone} ({u.phone})</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      )}

      {/* Title */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-textPrimary mb-1.5">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., New Feature: Multi-Currency Support"
          maxLength={200}
          className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      {/* Body */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-textPrimary mb-1.5">Message</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write the notification message..."
          rows={4}
          maxLength={1000}
          className="w-full px-3 py-2.5 border border-border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
        <p className="text-xs text-gray-400 mt-1">{body.length}/1000</p>
      </div>

      {/* Deep Link (optional) */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-textPrimary mb-1.5">
          Deep Link Route <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <input
          type="text"
          value={deepLinkRoute}
          onChange={(e) => setDeepLinkRoute(e.target.value)}
          placeholder="e.g., /plans or /settings"
          className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
        <p className="text-xs text-gray-400 mt-1">Where the user navigates when they tap the notification</p>
      </div>

      {/* Send Button */}
      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          disabled={!canSend}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            canSend
              ? 'bg-primary text-white active:bg-blue-700 md:hover:bg-blue-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Send className="w-4 h-4" />
          Send Notification
        </button>
      ) : (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">
              Send to {targetType === 'ALL' ? 'all users' : `selected ${targetType.toLowerCase()}`}?
            </p>
            <p className="text-xs text-amber-600 mt-0.5">This action cannot be undone.</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setShowConfirm(false)}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg active:bg-gray-50 md:hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={sendNotification.isPending}
              className="px-3 py-1.5 text-xs font-medium text-white bg-primary rounded-lg active:bg-blue-700 md:hover:bg-blue-700 disabled:opacity-50"
            >
              {sendNotification.isPending ? 'Sending...' : 'Confirm'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Notification History Tab ───────────────────────────────────────────
function NotificationHistory() {
  const [offset, setOffset] = useState(0)
  const [filterTargetType, setFilterTargetType] = useState('')
  const limit = 20

  const { data, isLoading } = useAdminNotifications({
    limit,
    offset,
    targetType: filterTargetType || undefined,
  })

  const notifications = data?.notifications || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / limit)
  const currentPage = Math.floor(offset / limit) + 1

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-xs font-medium text-textSecondary">Filter:</span>
        {['', 'ALL', 'USER', 'BUSINESS', 'PLAN'].map((t) => (
          <button
            key={t}
            onClick={() => { setFilterTargetType(t); setOffset(0) }}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              filterTargetType === t
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-textSecondary active:bg-gray-200 md:hover:bg-gray-200'
            }`}
          >
            {t || 'All'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Bell className="w-10 h-10 text-gray-300 mb-3" />
          <p className="text-sm font-medium text-textSecondary">No notifications sent yet</p>
        </div>
      ) : (
        <>
          {/* Table (desktop) / Cards (mobile) */}
          <div className="hidden md:block border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-textSecondary">Title</th>
                  <th className="text-left px-4 py-3 font-semibold text-textSecondary">Target</th>
                  <th className="text-left px-4 py-3 font-semibold text-textSecondary">Source</th>
                  <th className="text-center px-4 py-3 font-semibold text-textSecondary">Targets</th>
                  <th className="text-center px-4 py-3 font-semibold text-textSecondary">
                    <Eye className="w-3.5 h-3.5 inline" /> Read
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-textSecondary">Sent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {notifications.map((n) => (
                  <tr key={n.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-textPrimary truncate max-w-[250px]">{n.title}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[250px]">{n.body}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-gray-100 text-textSecondary rounded-full">
                        {TARGET_TYPE_LABELS[n.targetType] || n.targetType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-textSecondary">
                      {n.sentBy ? 'Admin' : 'System'}
                    </td>
                    <td className="px-4 py-3 text-center text-xs font-medium">{n.totalTargets}</td>
                    <td className="px-4 py-3 text-center text-xs font-medium">{n.readCount || 0}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {n.sentAt ? formatDistanceToNow(new Date(n.sentAt), { addSuffix: true }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {notifications.map((n) => (
              <div key={n.id} className="bg-white border border-border rounded-xl p-3.5">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <p className="text-sm font-semibold text-textPrimary line-clamp-1">{n.title}</p>
                  <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-textSecondary rounded-full shrink-0">
                    {TARGET_TYPE_LABELS[n.targetType] || n.targetType}
                  </span>
                </div>
                <p className="text-xs text-textSecondary line-clamp-2 mb-2">{n.body}</p>
                <div className="flex items-center justify-between text-[11px] text-gray-400">
                  <div className="flex items-center gap-3">
                    <span><Users className="w-3 h-3 inline mr-0.5" /> {n.totalTargets} targets</span>
                    <span><Eye className="w-3 h-3 inline mr-0.5" /> {n.readCount || 0} read</span>
                  </div>
                  <span>{n.sentAt ? format(new Date(n.sentAt), 'dd MMM, HH:mm') : '—'}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 px-1">
              <p className="text-xs text-gray-400">
                Showing {offset + 1}–{Math.min(offset + limit, total)} of {total}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  disabled={offset === 0}
                  className="px-3 py-1.5 text-xs font-medium border border-border rounded-lg disabled:opacity-40 active:bg-gray-50 md:hover:bg-gray-50"
                >
                  Prev
                </button>
                <button
                  onClick={() => setOffset(offset + limit)}
                  disabled={currentPage >= totalPages}
                  className="px-3 py-1.5 text-xs font-medium border border-border rounded-lg disabled:opacity-40 active:bg-gray-50 md:hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────
export default function AdminNotificationsPage() {
  const [activeTab, setActiveTab] = useState('send')

  const tabs = [
    { key: 'send', label: 'Send Notification', icon: Send },
    { key: 'history', label: 'History', icon: History },
  ]

  return (
    <div className="px-3 md:px-8 py-4 md:py-6 max-w-5xl">
      {/* Page Header */}
      <div className="mb-5">
        <h1 className="text-xl md:text-2xl font-bold text-textPrimary flex items-center gap-2">
          <Bell className="w-5 h-5 md:w-6 md:h-6 text-primary" />
          Notifications
        </h1>
        <p className="text-sm text-textSecondary mt-1">Send notifications to users and view history</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-border">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                active
                  ? 'border-primary text-primary'
                  : 'border-transparent text-textSecondary active:text-textPrimary md:hover:text-textPrimary'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'send' ? <SendNotificationForm /> : <NotificationHistory />}
    </div>
  )
}
