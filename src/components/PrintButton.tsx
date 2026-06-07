'use client'

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-lg bg-evergreen-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-evergreen-800 print:hidden"
    >
      Print manifest
    </button>
  )
}
