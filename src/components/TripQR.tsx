'use client'

import { QRCodeSVG } from 'qrcode.react'

/** Boarding-pass QR encoding the live booking URL. */
export default function TripQR({ url }: { url: string }) {
  return (
    <div className="inline-flex flex-col items-center gap-2 rounded-2xl bg-white p-4 ring-1 ring-mist-200">
      <QRCodeSVG value={url} size={160} level="M" />
      <span className="text-[11px] font-semibold uppercase tracking-wider text-mist-500">Scan at boarding</span>
    </div>
  )
}
