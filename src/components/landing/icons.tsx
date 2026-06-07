// Inline stroke icons for the FeatureGrid block — no external icon dependency.

type IconKey = 'check' | 'clock' | 'pin' | 'calendar' | 'shield' | 'star'

const paths: Record<IconKey, React.ReactNode> = {
  check: <path d="m4 12 5 5 11-11" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s-7-7.5-7-12a7 7 0 1 1 14 0c0 4.5-7 12-7 12Z" />
      <circle cx="12" cy="9" r="2.5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 3v4M16 3v4" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 4 6v6c0 4.5 3.2 8.5 8 9 4.8-.5 8-4.5 8-9V6l-8-3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  star: <path d="m12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 18.8 6.2 21.9l1.1-6.5L2.6 9.8l6.5-.9L12 3Z" />,
}

export function FeatureIcon({ name }: { name?: IconKey | null }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-6"
    >
      {paths[name ?? 'check'] ?? paths.check}
    </svg>
  )
}

/** A row of filled/empty stars for a 1–5 rating. */
export function Stars({ value, className = '' }: { value: number; className?: string }) {
  const full = Math.round(Math.max(0, Math.min(5, value)))
  return (
    <span aria-label={`${full} out of 5 stars`} className={`inline-flex gap-0.5 ${className}`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} viewBox="0 0 24 24" className="size-4" fill={i < full ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
          <path d="m12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 18.8 6.2 21.9l1.1-6.5L2.6 9.8l6.5-.9L12 3Z" />
        </svg>
      ))}
    </span>
  )
}
