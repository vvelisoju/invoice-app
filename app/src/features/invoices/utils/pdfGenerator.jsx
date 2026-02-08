import { pdf } from '@react-pdf/renderer'
import { TEMPLATE_COMPONENTS, CleanTemplate } from './templates/pdfTemplates.jsx'

// Convert an image URL to a data URI to avoid CORS issues in @react-pdf/renderer.
// Uses the server-side image proxy for GCS URLs so the fetch is same-origin.
const toDataUri = async (url) => {
  if (!url) return null
  try {
    // Route GCS URLs through our server proxy to avoid CORS
    const rawBase = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    const apiBase = rawBase.startsWith('http') ? rawBase : `https://${rawBase}`
    const isGcs = url.startsWith('https://storage.googleapis.com/')
    const fetchUrl = isGcs
      ? `${apiBase}/business/image-proxy?url=${encodeURIComponent(url)}`
      : url

    const token = localStorage.getItem('auth_token')
    const response = await fetch(fetchUrl, {
      ...(isGcs && token ? { headers: { Authorization: `Bearer ${token}` } } : {})
    })
    if (!response.ok) return url
    const blob = await response.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = () => resolve(url)
      reader.readAsDataURL(blob)
    })
  } catch {
    return url
  }
}

// Generate PDF blob using the specified template
export const generatePDF = async (invoice, templateConfig = null, templateId = null) => {
  // Resolve template component
  const resolvedId = templateId || templateConfig?.templateId || 'clean'
  const TemplateComponent = TEMPLATE_COMPONENTS[resolvedId] || CleanTemplate

  // Pre-fetch images as data URIs to avoid CORS issues in @react-pdf/renderer
  const logoUrl = invoice.logoUrl || invoice.business?.logoUrl
  const signatureUrl = invoice.signatureUrl || invoice.business?.signatureUrl
  const [logoDataUri, signatureDataUri] = await Promise.all([
    toDataUri(logoUrl),
    toDataUri(signatureUrl)
  ])

  // Inject resolved data URIs into the invoice object for the template
  const invoiceWithImages = {
    ...invoice,
    logoUrl: logoDataUri,
    signatureUrl: signatureDataUri,
    business: invoice.business ? {
      ...invoice.business,
      logoUrl: logoDataUri,
      signatureUrl: signatureDataUri
    } : invoice.business
  }

  const blob = await pdf(<TemplateComponent invoice={invoiceWithImages} />).toBlob()
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
