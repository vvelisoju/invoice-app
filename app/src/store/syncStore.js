import { create } from 'zustand'
import { syncService } from '../services/syncService'

export const useSyncStore = create((set, get) => ({
  isOnline: navigator.onLine,
  isSyncing: false,
  lastSyncAt: null,
  pendingCount: 0,

  // Initialize sync listener
  init: () => {
    syncService.subscribe((status) => {
      set({
        isOnline: status.isOnline,
        isSyncing: status.isSyncing,
        lastSyncAt: status.lastSyncAt
      })
    })

    // Update pending count periodically
    const updatePendingCount = async () => {
      const count = await syncService.getPendingCount()
      set({ pendingCount: count })
    }

    updatePendingCount()
    setInterval(updatePendingCount, 5000)

    // Start periodic sync
    syncService.startPeriodicSync()
  },

  // Manual sync trigger
  triggerSync: () => {
    syncService.sync()
  },

  // Add mutation
  addMutation: async (type, data) => {
    await syncService.addMutation(type, data)
    const count = await syncService.getPendingCount()
    set({ pendingCount: count })
  }
}))
