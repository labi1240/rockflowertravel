/**
 * Parks Canada parking notice. Rendered on the homepage stops section and on
 * every route landing page (template-level, so it shows regardless of
 * admin-authored CMS content). Required by the Moraine Lake Road Licence of
 * Occupation: the website must clearly communicate that no public-land parking
 * is permitted.
 */
export default function ParkingNotice({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex items-start gap-4 rounded-2xl border border-sky-200 bg-sky-50 p-5 sm:p-6 ${className}`}
    >
      <span aria-hidden className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-sky-100 text-sky-700">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5">
          <circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" />
        </svg>
      </span>
      <div className="min-w-0">
        <h3 className="font-display text-base font-bold text-sky-900">Parking notice — please read before you travel</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-sky-900/80">
          There is <strong>no customer parking</strong> at any Parks Canada parking lots, public
          parking areas, day-use areas, or trailheads at the <strong>Lake Louise Lakeshore</strong>{' '}
          or <strong>Moraine Lake</strong>. We are unable to provide or guarantee parking. Please
          leave your vehicle at your accommodation and reach your pickup point by local public
          transit or taxi.
        </p>
      </div>
    </div>
  );
}
