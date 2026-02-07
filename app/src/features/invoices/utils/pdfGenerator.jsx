import { pdf } from '@react-pdf/renderer'
import { TEMPLATE_COMPONENTS, CleanTemplate } from './templates/pdfTemplates.jsx'

// Generate PDF blob using the specified template
export const generatePDF = async (invoice, templateConfig = null, templateId = null) => {
  // Resolve template component
  const resolvedId = templateId || templateConfig?.templateId || 'clean'
  const TemplateComponent = TEMPLATE_COMPONENTS[resolvedId] || CleanTemplate

  const blob = await pdf(<TemplateComponent invoice={invoice} />).toBlob()
  return blob
}

// Download PDF
export const downloadPDF = async (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Get PDF as base64 (for Capacitor sharing)
export const getPDFBase64 = async (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
