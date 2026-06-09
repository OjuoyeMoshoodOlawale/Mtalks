/**
 * useSeoMeta — lightweight SEO composable for Muhsinah Academy (SPA)
 * Sets document.title and all relevant meta/OG tags per page.
 * No extra packages needed.
 */
import { onUnmounted } from 'vue'

const SITE   = 'Muhsinah Academy'
const DOMAIN = 'https://www.muhsinahacademy.com'
const DEFAULT_IMG = `${DOMAIN}/og-default.jpg`
const DEFAULT_DESC = 'Expert life and marriage coaching for Muslim sisters and couples in Nigeria. Online courses, live events, and private consultations with Coach Madinah Sanni.'

function setMeta (name, content, attr = 'name') {
  if (!content) return
  let el = document.querySelector(`meta[${attr}="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setLink (rel, href) {
  let el = document.querySelector(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

export function useSeoMeta ({
  title       = '',
  description = DEFAULT_DESC,
  image       = DEFAULT_IMG,
  url         = '',
  type        = 'website',
} = {}) {
  const fullTitle = title ? `${title} | ${SITE}` : `${SITE} — Relationship & Marriage Coaching`
  const pageUrl   = url ? `${DOMAIN}${url}` : DOMAIN

  document.title = fullTitle

  // Standard
  setMeta('description',  description)
  setMeta('robots',       'index, follow')

  // Open Graph
  setMeta('og:type',        type,        'property')
  setMeta('og:site_name',   SITE,        'property')
  setMeta('og:title',       fullTitle,   'property')
  setMeta('og:description', description, 'property')
  setMeta('og:image',       image,       'property')
  setMeta('og:url',         pageUrl,     'property')

  // Twitter Card
  setMeta('twitter:card',        'summary_large_image')
  setMeta('twitter:site',        '@muhsinahacademy')
  setMeta('twitter:title',       fullTitle)
  setMeta('twitter:description', description)
  setMeta('twitter:image',       image)

  // Canonical
  setLink('canonical', pageUrl)

  // Reset to defaults on unmount
  onUnmounted(() => {
    document.title = `${SITE} — Relationship & Marriage Coaching`
    setMeta('description', DEFAULT_DESC)
  })
}
