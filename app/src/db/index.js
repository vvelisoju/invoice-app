import Dexie from 'dexie'

export const db = new Dexie('InvoiceAppDB')

db.version(1).stores({
  // Invoices
  invoices: 'id, businessId, invoiceNumber, customerId, status, date, issuedAt, updatedAt',
  invoiceLineItems: 'id, invoiceId',
  
  // Customers
  customers: 'id, businessId, name, phone, updatedAt',
  
  // Products
  products: 'id, businessId, name, updatedAt',
  
  // Business settings
  businessSettings: 'id',
  
  // Template configs
  templateConfigs: 'id, businessId, baseTemplateId, isActive',
  
  // Sync metadata
  syncMeta: 'key',
  
  // Outbox for offline mutations
  outbox: '++id, timestamp, synced'
})

// Helper functions
export const dbHelpers = {
  // Get all invoices for a business
  getInvoices: async (businessId) => {
    return await db.invoices
      .where('businessId')
      .equals(businessId)
      .reverse()
      .sortBy('date')
  },

  // Get invoice with line items
  getInvoiceWithItems: async (invoiceId) => {
    const invoice = await db.invoices.get(invoiceId)
    if (!invoice) return null
    
    const lineItems = await db.invoiceLineItems
      .where('invoiceId')
      .equals(invoiceId)
      .toArray()
    
    return { ...invoice, lineItems }
  },

  // Save invoice with line items
  saveInvoice: async (invoice, lineItems) => {
    await db.transaction('rw', [db.invoices, db.invoiceLineItems], async () => {
      await db.invoices.put(invoice)
      
      // Delete existing line items
      await db.invoiceLineItems.where('invoiceId').equals(invoice.id).delete()
      
      // Add new line items
      if (lineItems && lineItems.length > 0) {
        await db.invoiceLineItems.bulkAdd(lineItems)
      }
    })
  },

  // Search customers
  searchCustomers: async (businessId, query) => {
    const customers = await db.customers
      .where('businessId')
      .equals(businessId)
      .toArray()
    
    if (!query) return customers
    
    const lowerQuery = query.toLowerCase()
    return customers.filter(c => 
      c.name?.toLowerCase().includes(lowerQuery) ||
      c.phone?.includes(query)
    )
  },

  // Search products
  searchProducts: async (businessId, query) => {
    const products = await db.products
      .where('businessId')
      .equals(businessId)
      .toArray()
    
    if (!query) return products
    
    const lowerQuery = query.toLowerCase()
    return products.filter(p => 
      p.name?.toLowerCase().includes(lowerQuery)
    )
  },

  // Add to outbox for sync
  addToOutbox: async (action, data) => {
    await db.outbox.add({
      action,
      data,
      timestamp: new Date().toISOString(),
      synced: false
    })
  },

  // Get pending sync items
  getPendingSync: async () => {
    return await db.outbox.where('synced').equals(false).toArray()
  },

  // Mark as synced
  markSynced: async (id) => {
    await db.outbox.update(id, { synced: true })
  }
}
