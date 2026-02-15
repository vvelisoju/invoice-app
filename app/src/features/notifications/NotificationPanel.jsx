import { useState, useRef, useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { X, Bell, CheckCheck } from 'lucide-react'
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from './useNotifications'
import NotificationItem from './NotificationItem'
import Portal from '../../components/Portal'

export default function NotificationPanel({ open, onClose }) {
  const history = useHistory()
  const panelRef = useRef(null)
  const [offset, setOffset] = useState(0)
  const limit = 30

  const { data, isLoading, isFetching } = useNotifications({ limit, offset })
  const markAsRead = useMarkAsRead()
  const markAllAsRead = useMarkAllAsRead()

  const notifications = data?.notifications || []
  const total = data?.total || 0
  const hasMore = offset + limit < total

  // Close on outside click (desktop)
  useEffect(() => {
    if (!open) return
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose()
      }
    }
    // Delay to avoid immediate close from the bell click
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick)
    }, 10)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClick)
    }
  }, [open, onClose])

  // Close on route change
  useEffect(() => {
    return history.listen(() => onClose())
  }, [history, onClose])

  // Prevent body scroll when open on mobile
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Reset offset when panel opens
  useEffect(() => {
    if (open) setOffset(0)
  }, [open])

  const handleNotificationClick = (notification) => {
    // Mark as read
    if (!notification.isRead) {
      markAsRead.mutate(notification.id)
    }
    // Navigate if deep link exists
    if (notification.data?.route) {
      history.push(notification.data.route)
    }
    onClose()
  }

  const handleMarkAllRead = () => {
    markAllAsRead.mutate()
  }

  if (!open) return null

  const panelContent = (
    <div className="flex flex-col h-full max-h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <h3 className="text-base font-bold text-textPrimary">Notifications</h3>
        <div className="flex items-center gap-1">
          {notifications.some(n => !n.isRead) && (
            <button
              onClick={handleMarkAllRead}
              disabled={markAllAsRead.isPending}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-primary active:bg-blue-50 md:hover:bg-blue-50 rounded-md transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Mark all read</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-textSecondary active:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Notification List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <Bell className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-textSecondary">No notifications yet</p>
            <p className="text-xs text-gray-400 mt-1">We'll notify you when something important happens</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-border/50">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={handleNotificationClick}
                />
              ))}
            </div>
            {hasMore && (
              <div className="py-3 px-4">
                <button
                  onClick={() => setOffset(prev => prev + limit)}
                  disabled={isFetching}
                  className="w-full py-2.5 text-xs font-medium text-primary active:bg-blue-50 md:hover:bg-blue-50 rounded-lg transition-colors"
                >
                  {isFetching ? 'Loading...' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop: Dropdown panel */}
      <div
        ref={panelRef}
        className="hidden md:block absolute right-0 top-full mt-2 w-96 bg-white border border-border rounded-xl shadow-xl z-50 max-h-[70vh] overflow-hidden"
      >
        {panelContent}
      </div>

      {/* Mobile: Full-screen slide-over via Portal */}
      <Portal>
        <div className="md:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 transition-opacity"
            onClick={onClose}
          />
          {/* Sheet */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl animate-slide-up max-h-[80vh] overflow-hidden flex flex-col">
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>
            {panelContent}
          </div>
        </div>
      </Portal>
    </>
  )
}
