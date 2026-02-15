import { useState, useRef } from 'react'
import { Bell } from 'lucide-react'
import { useUnreadCount } from './useNotifications'
import NotificationPanel from './NotificationPanel'

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const bellRef = useRef(null)
  const { data: unreadCount = 0 } = useUnreadCount()

  return (
    <div className="relative" ref={bellRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative w-11 h-11 flex items-center justify-center rounded-lg text-textSecondary active:bg-bgPrimary md:hover:text-textPrimary transition-colors"
      >
        <Bell className="w-[18px] h-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold text-white bg-red-500 rounded-full leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationPanel open={open} onClose={() => setOpen(false)} />
    </div>
  )
}
