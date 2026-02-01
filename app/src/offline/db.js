import Dexie from 'dexie'

export const db = new Dexie('InvoiceAppDB')

db.version(1).stores({
  customers: 'id, businessId, name, phone, updatedAt',
  products: 'id, businessId, name, updatedAt',
  invoices: 'id, businessId, invoiceNumber, customerId, status, date, updatedAt',
  invoiceLineItems: 'id, invoiceId',
  businessSettings: 'id',
  templateConfigs: 'id, businessId, version',
  outbox: '++id, entityType, entityId, createdAt',
  syncMeta: 'key'
})

export default db
