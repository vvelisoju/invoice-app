import { v4 as uuidv4 } from 'uuid'
import { db } from '../db'
import { api } from '../lib/api'

const SYNC_INTERVAL = 30000 // 30 seconds
const MAX_RETRY_ATTEMPTS = 3
const RETRY_DELAY = 5000 // 5 seconds

class SyncService {
  constructor() {
    this.isOnline = navigator.onLine
    this.isSyncing = false
    this.lastSyncAt = null
    this.listeners = new Set()
    this.syncInterval = null

    // Listen for online/offline events
    window.addEventListener('online', () => this.handleOnline())
    window.addEventListener('offline', () => this.handleOffline())
  }

  // Subscribe to sync status changes
  subscribe(listener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  // Notify all listeners
  notify() {
    const status = this.getStatus()
    this.listeners.forEach(listener => listener(status))
  }

  // Get current sync status
  getStatus() {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      lastSyncAt: this.lastSyncAt,
      pendingCount: 0 // Will be updated async
    }
  }

  handleOnline() {
    this.isOnline = true
    this.notify()
    this.sync() // Trigger sync when coming online
  }

  handleOffline() {
    this.isOnline = false
    this.notify()
  }

  // Start periodic sync
  startPeriodicSync() {
    if (this.syncInterval) return

    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.sync()
      }
    }, SYNC_INTERVAL)

    // Initial sync
    if (this.isOnline) {
      this.sync()
    }
  }

  // Stop periodic sync
  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }

  // Main sync function
  async sync() {
    if (!this.isOnline || this.isSyncing) return

    this.isSyncing = true
    this.notify()

    try {
      // 1. Push pending mutations
      await this.pushPendingMutations()

      // 2. Pull changes from server
      await this.pullChanges()

      this.lastSyncAt = new Date().toISOString()
      await db.syncMeta.put({ key: 'lastSyncAt', value: this.lastSyncAt })
    } catch (error) {
      console.error('Sync failed:', error)
    } finally {
      this.isSyncing = false
      this.notify()
    }
  }

  // Push pending mutations to server
  async pushPendingMutations() {
    const pending = await db.outbox
      .where('synced')
      .equals(0)
      .toArray()

    if (pending.length === 0) return

    // Group mutations into batches
    const mutations = pending.map(item => ({
      id: item.id.toString(),
      type: item.type,
      idempotencyKey: item.idempotencyKey,
      data: item.data
    }))

    try {
      const response = await api.post('/sync/batch', { mutations })
      const results = response.data.data

      // Process results
      for (const result of results) {
        const outboxId = parseInt(result.id)
        if (result.status === 'success') {
          await db.outbox.update(outboxId, { synced: 1 })

          // Update local data with server response
          const mutation = pending.find(p => p.id === outboxId)
          if (mutation && result.data) {
            await this.updateLocalData(mutation.type, result.data)
          }
        } else if (result.status === 'error') {
          // Increment retry count
          const item = pending.find(p => p.id === outboxId)
          if (item) {
            const retryCount = (item.retryCount || 0) + 1
            if (retryCount >= MAX_RETRY_ATTEMPTS) {
              // Mark as failed
              await db.outbox.update(outboxId, { 
                synced: -1, 
                error: result.error,
                retryCount 
              })
            } else {
              await db.outbox.update(outboxId, { retryCount })
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to push mutations:', error)
      throw error
    }
  }

  // Pull changes from server
  async pullChanges() {
    const syncMeta = await db.syncMeta.get('lastSyncAt')
    const lastSyncAt = syncMeta?.value

    try {
      let response
      if (lastSyncAt) {
        // Delta sync
        response = await api.get('/sync/delta', { params: { lastSyncAt } })
      } else {
        // Full sync
        response = await api.get('/sync/full')
      }

      const data = response.data.data

      // Update local database
      await db.transaction('rw', [db.invoices, db.invoiceLineItems, db.customers, db.products], async () => {
        // Update invoices
        if (data.invoices) {
          for (const invoice of data.invoices) {
            const { lineItems, ...invoiceData } = invoice
            await db.invoices.put(invoiceData)

            if (lineItems) {
              await db.invoiceLineItems.where('invoiceId').equals(invoice.id).delete()
              await db.invoiceLineItems.bulkPut(lineItems)
            }
          }
        }

        // Update customers
        if (data.customers) {
          await db.customers.bulkPut(data.customers)
        }

        // Update products
        if (data.products) {
          await db.products.bulkPut(data.products)
        }
      })

      // Update sync timestamp
      if (data.syncedAt) {
        await db.syncMeta.put({ key: 'lastSyncAt', value: data.syncedAt })
      }
    } catch (error) {
      console.error('Failed to pull changes:', error)
      throw error
    }
  }

  // Update local data after successful sync
  async updateLocalData(type, data) {
    switch (type) {
      case 'CREATE_INVOICE':
      case 'UPDATE_INVOICE':
        const { lineItems, ...invoiceData } = data
        await db.invoices.put(invoiceData)
        if (lineItems) {
          await db.invoiceLineItems.where('invoiceId').equals(data.id).delete()
          await db.invoiceLineItems.bulkPut(lineItems)
        }
        break
      case 'CREATE_CUSTOMER':
      case 'UPDATE_CUSTOMER':
        await db.customers.put(data)
        break
      case 'CREATE_PRODUCT':
      case 'UPDATE_PRODUCT':
        await db.products.put(data)
        break
    }
  }

  // Add mutation to outbox
  async addMutation(type, data) {
    const idempotencyKey = uuidv4()

    await db.outbox.add({
      type,
      data,
      idempotencyKey,
      timestamp: new Date().toISOString(),
      synced: 0,
      retryCount: 0
    })

    // Trigger sync if online
    if (this.isOnline && !this.isSyncing) {
      setTimeout(() => this.sync(), 1000)
    }

    return idempotencyKey
  }

  // Get pending mutation count
  async getPendingCount() {
    return await db.outbox.where('synced').equals(0).count()
  }

  // Clear synced items from outbox
  async clearSyncedItems() {
    await db.outbox.where('synced').equals(1).delete()
  }
}

export const syncService = new SyncService()
