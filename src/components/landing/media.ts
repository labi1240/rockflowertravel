import type { Media } from '@/payload-types'

export type ResolvedImage = { url: string; alt: string; width?: number; height?: number }

/**
 * Resolve a Payload upload field (populated Media object, bare id, or null) to a
 * render-ready image. Returns null when the field is empty or unpopulated —
 * callers should render a fallback or skip the image.
 */
export function resolveMedia(value: number | Media | null | undefined): ResolvedImage | null {
  if (!value || typeof value !== 'object') return null
  const m = value as Media
  if (!m.url) return null
  return {
    url: m.url,
    alt: m.alt || '',
    width: m.width ?? undefined,
    height: m.height ?? undefined,
  }
}
