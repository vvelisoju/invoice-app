import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationApi, adminApi } from '../../lib/api'

// ============================================================================
// USER HOOKS
// ============================================================================

export function useNotifications({ limit = 30, offset = 0, unreadOnly = false } = {}) {
  return useQuery({
    queryKey: ['notifications', { limit, offset, unreadOnly }],
    queryFn: () => notificationApi.list({ limit, offset, unreadOnly }).then(r => r.data.data),
    staleTime: 1000 * 30,
  })
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationApi.getUnreadCount().then(r => r.data.data.count),
    refetchInterval: 30000,
    staleTime: 1000 * 15,
  })
}

export function useMarkAsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (notificationId) => notificationApi.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

// ============================================================================
// ADMIN HOOKS
// ============================================================================

export function useAdminNotifications({ limit = 30, offset = 0, targetType, templateKey } = {}) {
  return useQuery({
    queryKey: ['admin', 'notifications', { limit, offset, targetType, templateKey }],
    queryFn: () => adminApi.listNotifications({ limit, offset, targetType, templateKey }).then(r => r.data.data),
    staleTime: 1000 * 30,
  })
}

export function useAdminNotificationDetail(id) {
  return useQuery({
    queryKey: ['admin', 'notifications', id],
    queryFn: () => adminApi.getNotification(id).then(r => r.data.data),
    enabled: !!id,
  })
}

export function useSendNotification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => adminApi.sendNotification(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] })
    },
  })
}

export function useNotificationTemplates() {
  return useQuery({
    queryKey: ['admin', 'notification-templates'],
    queryFn: () => adminApi.getNotificationTemplates().then(r => r.data.data),
    staleTime: 1000 * 60 * 60,
  })
}
