import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Request-time clock read for async server components. They render once per
 * request, so reading the clock is safe there — but react-hooks/purity can't
 * tell server from client components and flags bare `Date.now()` in render.
 */
export function requestNowMs(): number {
  return Date.now()
}