import * as syncService from './service.js'

export async function getDelta(request, reply) {
  const { lastSyncAt } = request.query
  const changes = await syncService.getDeltaChanges(request.businessId, lastSyncAt)
  return { data: changes }
}

export async function getFullSync(request, reply) {
  const data = await syncService.getFullSync(request.businessId)
  return { data }
}

export async function processBatch(request, reply) {
  const { mutations } = request.body
  
  if (!mutations || !Array.isArray(mutations)) {
    return reply.code(400).send({
      error: { message: 'mutations array is required' }
    })
  }

  const results = await syncService.processBatchMutations(request.businessId, mutations)
  return { data: results }
}
