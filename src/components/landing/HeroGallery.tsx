import Image from 'next/image'
import type { ResolvedImage } from './media'

/**
 * Viator-style gallery header: 1 large lead image + up to 4 supporting tiles.
 * Degrades gracefully — 1 image fills the frame, 0 images shows an evergreen
 * gradient so the layout never collapses or shows a broken-image icon.
 */
export default function HeroGallery({ images, alt }: { images: ResolvedImage[]; alt: string }) {
  if (images.length === 0) {
    return <div className="h-[38vh] min-h-[280px] w-full rounded-3xl bg-gradient-to-br from-evergreen-700 to-evergreen-950 sm:h-[44vh]" />
  }

  if (images.length === 1) {
    const img = images[0]
    return (
      <div className="relative h-[40vh] min-h-[300px] w-full overflow-hidden rounded-3xl sm:h-[52vh]">
        <Image src={img.url} alt={img.alt || alt} fill priority sizes="100vw" className="object-cover" />
      </div>
    )
  }

  const [lead, ...rest] = images.slice(0, 5)
  return (
    <div className="grid h-[44vh] min-h-[320px] grid-cols-1 gap-2 overflow-hidden rounded-3xl sm:h-[52vh] sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2">
      <div className="relative col-span-1 row-span-1 sm:col-span-1 sm:row-span-2 lg:col-span-2 lg:row-span-2">
        <Image src={lead.url} alt={lead.alt || alt} fill priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
      </div>
      {rest.map((img, i) => (
        <div key={i} className="relative hidden sm:block">
          <Image src={img.url} alt={img.alt || alt} fill sizes="25vw" className="object-cover" />
        </div>
      ))}
    </div>
  )
}
