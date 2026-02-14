import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

/**
 * Native-aware file utilities.
 * On native (iOS/Android): uses Capacitor Filesystem + Share plugins.
 * On web: falls back to standard browser APIs (anchor download, Web Share, file-saver).
 */

function isNative() {
  return Capacitor.isNativePlatform()
}

/**
 * Convert a Blob to a base64 string (without the data URI prefix).
 */
function blobToBase64(blob) {
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

/**
 * Save a blob to the device and trigger the native share sheet.
 * On web, falls back to anchor-tag download.
 *
 * @param {Blob} blob - The file blob to save/share
 * @param {string} filename - Desired filename (e.g. "Invoice-001.pdf")
 * @param {object} [options]
 * @param {string} [options.mimeType] - MIME type override (default: blob.type)
 * @param {string} [options.dialogTitle] - Share dialog title (native only)
 */
export async function downloadFile(blob, filename, options = {}) {
  if (!isNative()) {
    // Web: anchor-tag download
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    return
  }

  // Native: write to cache directory, then share
  const base64 = await blobToBase64(blob)
  const result = await Filesystem.writeFile({
    path: filename,
    data: base64,
    directory: Directory.Cache,
  })

  await Share.share({
    title: options.dialogTitle || filename,
    url: result.uri,
    dialogTitle: options.dialogTitle || 'Save or share file',
  })
}

/**
 * Share a blob via the native share sheet (or Web Share API).
 * Falls back to downloadFile if sharing is not supported.
 *
 * @param {Blob} blob - The file blob to share
 * @param {string} filename - Desired filename
 * @param {object} [options]
 * @param {string} [options.title] - Share title
 * @param {string} [options.text] - Share text/description
 */
export async function shareFile(blob, filename, options = {}) {
  if (!isNative()) {
    // Web: try Web Share API first
    if (navigator.share && navigator.canShare) {
      const file = new File([blob], filename, { type: blob.type || 'application/octet-stream' })
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: options.title || filename,
          text: options.text || '',
          files: [file],
        })
        return
      }
    }
    // Fallback to download
    await downloadFile(blob, filename)
    return
  }

  // Native: write to cache, then share
  const base64 = await blobToBase64(blob)
  const result = await Filesystem.writeFile({
    path: filename,
    data: base64,
    directory: Directory.Cache,
  })

  await Share.share({
    title: options.title || filename,
    text: options.text || '',
    url: result.uri,
    dialogTitle: options.title || 'Share',
  })
}

/**
 * Print a PDF blob.
 * On web: opens in a new window and triggers print.
 * On native: shares the file (native print is accessible via share sheet).
 *
 * @param {Blob} blob - PDF blob
 * @param {string} filename - Filename for the PDF
 */
export async function printFile(blob, filename) {
  if (!isNative()) {
    const url = URL.createObjectURL(blob)
    const printWindow = window.open(url, '_blank')
    if (printWindow) {
      printWindow.onload = () => printWindow.print()
    }
    return
  }

  // Native: share the PDF — iOS/Android share sheets include "Print" option
  await shareFile(blob, filename, { title: 'Print' })
}

/**
 * Drop-in replacement for file-saver's saveAs().
 * Native-aware: uses Filesystem + Share on native, anchor download on web.
 *
 * @param {Blob} blob - The file blob
 * @param {string} filename - Desired filename
 */
export async function saveAs(blob, filename) {
  await downloadFile(blob, filename)
}
