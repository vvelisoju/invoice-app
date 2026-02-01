import * as templateService from './service.js'

export async function listTemplates(request, reply) {
  const templates = await templateService.listBaseTemplates()
  return { data: templates }
}

export async function getTemplate(request, reply) {
  const { id } = request.params
  const template = await templateService.getBaseTemplate(id)
  return { data: template }
}

export async function getBusinessConfig(request, reply) {
  const config = await templateService.getBusinessTemplateConfig(request.businessId)
  return { data: config }
}

export async function updateBusinessConfig(request, reply) {
  const config = await templateService.updateBusinessTemplateConfig(
    request.businessId,
    request.body
  )
  return { data: config }
}

export async function getSnapshot(request, reply) {
  const snapshot = await templateService.getTemplateSnapshot(request.businessId)
  return { data: snapshot }
}
