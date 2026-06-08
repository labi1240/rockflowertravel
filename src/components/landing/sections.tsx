import Image from 'next/image'
import RouteMapInteractive from '@/components/RouteMapInteractive'
import ServiceBookButton from '@/components/ServiceBookButton'
import type { BookingRouteId } from '@/store/booking-modal'
import type {
  CtaBlock,
  FaqBlock,
  FeatureGridBlock,
  GalleryBlock,
  HighlightsBlock,
  InclusionsBlock,
  ItineraryBlock,
  RichTextBlock,
  RouteMapBlock,
  TestimonialsBlock,
  ThingsToDoBlock,
} from '@/payload-types'
import { resolveMedia } from './media'
import { FeatureIcon, Stars } from './icons'
import LexicalContent from './LexicalContent'

// Shared section heading.
function SectionHeading({ heading, subheading }: { heading?: string | null; subheading?: string | null }) {
  if (!heading && !subheading) return null
  return (
    <header className="mb-8">
      {heading && (
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-evergreen-800 sm:text-3xl">{heading}</h2>
      )}
      {subheading && <p className="mt-3 max-w-2xl text-base text-mist-500">{subheading}</p>}
    </header>
  )
}

function Container({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-5xl px-4 sm:px-6 ${className}`}>{children}</div>
}

export function HighlightsSection({ block }: { block: HighlightsBlock }) {
  const items = block.items ?? []
  if (!items.length) return null
  return (
    <section className="py-12">
      <Container>
        <SectionHeading heading={block.heading} />
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((it) => (
            <li key={it.id ?? it.text} className="flex items-start gap-3 rounded-xl bg-white p-4 text-sm text-mist-800 shadow-[var(--shadow-card)] ring-1 ring-mist-200/60">
              <span className="mt-0.5 text-evergreen-600">✓</span>
              {it.text}
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}

export function FeatureGridSection({ block }: { block: FeatureGridBlock }) {
  const features = block.features ?? []
  if (!features.length) return null
  return (
    <section className="bg-white py-14">
      <Container className="text-center">
        <SectionHeading heading={block.heading} subheading={block.subheading} />
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.id ?? f.title} className="flex flex-col items-center">
              <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-sunrise-100 text-sunrise-700">
                <FeatureIcon name={f.icon} />
              </span>
              <h3 className="mt-4 font-display text-lg font-bold text-evergreen-800">{f.title}</h3>
              {f.body && <p className="mt-2 text-sm text-mist-500">{f.body}</p>}
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}

export function InclusionsSection({ block }: { block: InclusionsBlock }) {
  const includes = block.includes ?? []
  const excludes = block.excludes ?? []
  if (!includes.length && !excludes.length) return null
  return (
    <section className="py-12">
      <Container>
        <SectionHeading heading={block.heading} />
        <div className="grid gap-8 sm:grid-cols-2">
          {includes.length > 0 && (
            <div className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)] ring-1 ring-mist-200/60">
              <h3 className="font-display text-base font-bold text-evergreen-800">What&apos;s included</h3>
              <ul className="mt-4 space-y-2.5">
                {includes.map((it) => (
                  <li key={it.id ?? it.text} className="flex items-start gap-2.5 text-sm text-mist-800">
                    <span className="mt-0.5 text-evergreen-600">✓</span>
                    {it.text}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {excludes.length > 0 && (
            <div className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)] ring-1 ring-mist-200/60">
              <h3 className="font-display text-base font-bold text-mist-900">Not included</h3>
              <ul className="mt-4 space-y-2.5">
                {excludes.map((it) => (
                  <li key={it.id ?? it.text} className="flex items-start gap-2.5 text-sm text-mist-500">
                    <span className="mt-0.5 text-mist-400">✕</span>
                    {it.text}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Container>
    </section>
  )
}

export function ItinerarySection({ block }: { block: ItineraryBlock }) {
  const steps = block.steps ?? []
  if (!steps.length) return null
  return (
    <section className="py-12">
      <Container>
        <SectionHeading heading={block.heading} />
        <ol className="relative space-y-6 border-l-2 border-mist-200 pl-8">
          {steps.map((s, i) => (
            <li key={s.id ?? `${s.title}-${i}`} className="relative">
              <span className="absolute -left-[41px] flex size-7 items-center justify-center rounded-full bg-evergreen-700 text-xs font-bold text-white">
                {i + 1}
              </span>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-display text-base font-bold text-evergreen-800">{s.title}</h3>
                {s.duration && (
                  <span className="rounded-full bg-mist-100 px-2.5 py-0.5 text-xs font-medium text-mist-500">{s.duration}</span>
                )}
              </div>
              {s.description && <p className="mt-1.5 text-sm text-mist-700">{s.description}</p>}
            </li>
          ))}
        </ol>
      </Container>
    </section>
  )
}

export function RouteMapSection({ block }: { block: RouteMapBlock }) {
  return (
    <section className="py-12">
      <Container>
        <SectionHeading heading={block.heading} subheading={block.subheading} />
        <RouteMapInteractive />
      </Container>
    </section>
  )
}

export function GallerySection({ block }: { block: GalleryBlock }) {
  const images = (block.images ?? []).map((row) => ({ ...resolveMedia(row.image), caption: row.caption, key: row.id })).filter((x) => x.url)
  if (!images.length) return null
  return (
    <section className="py-12">
      <Container>
        <SectionHeading heading={block.heading} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((img, i) => (
            <figure key={img.key ?? i} className="group relative aspect-[4/3] overflow-hidden rounded-2xl ring-1 ring-mist-200">
              <Image
                src={img.url!}
                alt={img.alt || img.caption || 'Gallery photo'}
                fill
                sizes="(max-width: 640px) 50vw, 33vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {img.caption && (
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-evergreen-950/80 to-transparent p-3 text-xs font-medium text-white">
                  {img.caption}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      </Container>
    </section>
  )
}

export function ThingsToDoSection({ block }: { block: ThingsToDoBlock }) {
  const items = block.items ?? []
  const image = resolveMedia(block.image)
  return (
    <section className="bg-evergreen-900 py-16 text-mist-50">
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            {block.heading && <h2 className="font-display text-3xl font-extrabold tracking-tight text-white">{block.heading}</h2>}
            {block.intro && <p className="mt-4 text-mist-200">{block.intro}</p>}
            {items.length > 0 && (
              <ul className="mt-6 space-y-2.5">
                {items.map((it) => (
                  <li key={it.id ?? it.text} className="flex items-start gap-2.5 text-sm text-mist-100">
                    <span className="mt-0.5 text-sunrise-400">›</span>
                    {it.text}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {image && (
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl ring-1 ring-white/10">
              <Image src={image.url} alt={image.alt || block.heading || 'Activity'} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
            </div>
          )}
        </div>
      </Container>
    </section>
  )
}

export function TestimonialsSection({
  block,
  ratingValue,
  ratingCount,
}: {
  block: TestimonialsBlock
  ratingValue?: number | null
  ratingCount?: number | null
}) {
  const reviews = block.reviews ?? []
  if (!reviews.length) return null
  // Prefer the route's headline rating; otherwise average the review stars.
  const avg =
    ratingValue ?? reviews.reduce((sum, r) => sum + (r.rating ?? 5), 0) / reviews.length
  const count = ratingCount ?? reviews.length
  return (
    <section className="py-14">
      <Container>
        <SectionHeading heading={block.heading} />
        <div className="mb-8 flex flex-col items-center gap-3 rounded-2xl bg-white p-6 text-center shadow-[var(--shadow-card)] ring-1 ring-mist-200/60 sm:flex-row sm:justify-center sm:gap-6 sm:text-left">
          <div className="font-display text-5xl font-extrabold text-evergreen-800">{avg.toFixed(1)}</div>
          <div>
            <Stars value={avg} className="text-sunrise-500" />
            <p className="mt-1 text-sm text-mist-500">Based on {count.toLocaleString()} reviews</p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {reviews.map((r) => (
            <figure key={r.id ?? r.name} className="flex flex-col rounded-2xl bg-white p-6 shadow-[var(--shadow-card)] ring-1 ring-mist-200/60">
              <Stars value={r.rating ?? 5} className="text-sunrise-500" />
              <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-mist-700">“{r.text}”</blockquote>
              <figcaption className="mt-4 text-sm">
                <span className="font-bold text-mist-900">{r.name}</span>
                {r.location && <span className="text-mist-500"> · {r.location}</span>}
              </figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </section>
  )
}

export function FaqSection({ block }: { block: FaqBlock }) {
  const items = block.items ?? []
  if (!items.length) return null
  return (
    <section className="py-14">
      <Container className="max-w-3xl">
        <SectionHeading heading={block.heading ?? 'Frequently asked'} />
        <div className="overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-card)] ring-1 ring-mist-200/60">
          {items.map((it, i) => (
            <details key={it.id ?? i} className="group border-t border-mist-200 first:border-t-0">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-left transition-colors [&::-webkit-details-marker]:hidden hover:bg-mist-50/80 group-open:bg-sunrise-50/40">
                <span className="font-display text-base font-semibold text-mist-900">{it.question}</span>
                <span aria-hidden className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-mist-100 text-mist-500 transition-all group-open:rotate-180 group-open:bg-evergreen-800 group-open:text-white">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
                    <path d="m4 6 4 4 4-4" />
                  </svg>
                </span>
              </summary>
              <p className="px-6 pb-6 pt-1 text-[15px] leading-relaxed text-mist-700">{it.answer}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  )
}

export function RichTextSection({ block }: { block: RichTextBlock }) {
  return (
    <section className="py-12">
      <Container className="max-w-3xl">
        <LexicalContent data={block.content} />
      </Container>
    </section>
  )
}

export function CtaSection({ block, fareId }: { block: CtaBlock; fareId: BookingRouteId | null }) {
  const image = resolveMedia(block.image)
  return (
    <section className="relative overflow-hidden bg-evergreen-800 py-20 text-center text-white">
      {image && (
        <>
          <Image src={image.url} alt="" fill sizes="100vw" className="object-cover opacity-30" />
          <div className="absolute inset-0 bg-evergreen-950/50" />
        </>
      )}
      <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
        <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{block.heading}</h2>
        {block.body && <p className="mx-auto mt-4 max-w-xl text-mist-100">{block.body}</p>}
        {fareId && (
          <div className="mt-8 flex justify-center">
            <ServiceBookButton route={fareId} variant="gold">
              {block.buttonLabel || 'Book now'}
            </ServiceBookButton>
          </div>
        )}
      </div>
    </section>
  )
}
