import { useEffect } from 'react'
import { BRANDING } from '../config/branding'

const { seo } = BRANDING

/**
 * Lightweight <head> manager for SPA SEO.
 * Sets document.title and updates meta/link tags on mount.
 * No external dependency needed — works with React 18.
 *
 * Usage:
 *   <SEOHead
 *     title="Contact Us"
 *     description="Get in touch with Invoice Baba..."
 *     path="/contact"
 *     type="website"
 *   />
 */
function SEOHead({
  title,
  description,
  path = '/',
  type = 'website',
  noindex = false,
  jsonLd,
}) {
  const fullTitle = title
    ? `${title} | Invoice Baba`
    : seo.defaultTitle
  const fullDescription = description || seo.defaultDescription
  const canonicalUrl = `${seo.siteUrl}${path}`

  useEffect(() => {
    // Title
    document.title = fullTitle

    // Standard meta
    setMeta('description', fullDescription)
    setMeta('keywords', seo.keywords.join(', '))
    setMeta('author', seo.companyName)
    setMeta('robots', noindex ? 'noindex, nofollow' : 'index, follow')

    // Open Graph
    setMeta('og:title', fullTitle, 'property')
    setMeta('og:description', fullDescription, 'property')
    setMeta('og:url', canonicalUrl, 'property')
    setMeta('og:type', type, 'property')
    setMeta('og:site_name', BRANDING.name, 'property')
    setMeta('og:locale', seo.locale, 'property')
    setMeta('og:image', `${seo.siteUrl}${seo.ogImage}`, 'property')
    setMeta('og:image:width', '1200', 'property')
    setMeta('og:image:height', '630', 'property')
    setMeta('og:image:alt', `${BRANDING.name} — ${BRANDING.tagline}`, 'property')

    // Twitter Card
    setMeta('twitter:card', 'summary_large_image')
    setMeta('twitter:site', seo.twitterHandle)
    setMeta('twitter:creator', seo.twitterHandle)
    setMeta('twitter:title', fullTitle)
    setMeta('twitter:description', fullDescription)
    setMeta('twitter:image', `${seo.siteUrl}${seo.ogImage}`)
    setMeta('twitter:image:alt', `${BRANDING.name} — ${BRANDING.tagline}`)

    // Canonical URL
    setLink('canonical', canonicalUrl)

    // JSON-LD structured data
    if (jsonLd) {
      let scriptEl = document.getElementById('seo-jsonld')
      if (!scriptEl) {
        scriptEl = document.createElement('script')
        scriptEl.id = 'seo-jsonld'
        scriptEl.type = 'application/ld+json'
        document.head.appendChild(scriptEl)
      }
      scriptEl.textContent = JSON.stringify(jsonLd)
    }

    return () => {
      // Cleanup JSON-LD on unmount so next page can set its own
      const scriptEl = document.getElementById('seo-jsonld')
      if (scriptEl) scriptEl.remove()
    }
  }, [fullTitle, fullDescription, canonicalUrl, type, noindex, jsonLd])

  return null
}

/** Set or create a <meta> tag */
function setMeta(nameOrProperty, content, attr = 'name') {
  const selector = `meta[${attr}="${nameOrProperty}"]`
  let el = document.querySelector(selector)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, nameOrProperty)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

/** Set or create a <link> tag */
function setLink(rel, href) {
  const selector = `link[rel="${rel}"]`
  let el = document.querySelector(selector)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

export default SEOHead
