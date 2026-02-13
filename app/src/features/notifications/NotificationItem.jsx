import { Crown, Shield, AlertTriangle, Megaphone, Bell, CreditCard, Gauge } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const CATEGORY_ICONS = {
  onboarding: Bell,
  plan: Crown,
  billing: CreditCard,
  usage: Gauge,
  account: Shield,
  platform: Megaphone,
  custom: Bell,
}

const CATEGORY_COLORS = {
  onboarding: 'text-blue-500 bg-blue-50',
  plan: 'text-amber-500 bg-amber-50',
  billing: 'text-green-500 bg-green-50',
  usage: 'text-orange-500 bg-orange-50',
  account: 'text-red-500 bg-red-50',
  platform: 'text-purple-500 bg-purple-50',
  custom: 'text-gray-500 bg-gray-50',
}

function getCategoryFromTemplate(templateKey) {
  if (!templateKey) return 'custom'
  if (templateKey.startsWith('plan_') || templateKey === 'plan_activated') return 'plan'
  if (templateKey.startsWith('payment_')) return 'billing'
  if (templateKey.startsWith('usage_')) return 'usage'
  if (templateKey.startsWith('business_')) return 'account'
  if (templateKey === 'welcome') return 'onboarding'
  if (templateKey === 'new_feature' || templateKey === 'maintenance') return 'platform'
  return 'custom'
}

export default function NotificationItem({ notification, onClick }) {
  const category = getCategoryFromTemplate(notification.templateKey)
  const Icon = CATEGORY_ICONS[category] || Bell
  const colorClass = CATEGORY_COLORS[category] || CATEGORY_COLORS.custom
  const isUnread = !notification.isRead

  const timeAgo = notification.sentAt
    ? formatDistanceToNow(new Date(notification.sentAt), { addSuffix: true })
    : ''

  return (
    <button
      onClick={() => onClick?.(notification)}
      className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors tap-target-auto ${
        isUnread
          ? 'bg-blue-50/50 active:bg-blue-50 md:hover:bg-blue-50'
          : 'active:bg-gray-50 md:hover:bg-gray-50'
      }`}
    >
      {/* Icon */}
      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${colorClass}`}>
        <Icon className="w-4 h-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm leading-snug ${isUnread ? 'font-semibold text-textPrimary' : 'font-medium text-textSecondary'}`}>
            {notification.title}
          </p>
          {isUnread && (
            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
          )}
        </div>
        <p className="text-xs text-textSecondary mt-0.5 line-clamp-2 leading-relaxed">
          {notification.body}
        </p>
        <p className="text-[11px] text-gray-400 mt-1">{timeAgo}</p>
      </div>
    </button>
  )
}
