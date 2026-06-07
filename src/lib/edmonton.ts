/**
 * Edmonton (America/Edmonton) calendar helpers.
 *
 * `Booking.serviceDate` and `Trip.serviceDate` are Prisma `@db.Date` columns,
 * which round-trip as a JS `Date` at UTC midnight of the calendar day. To filter
 * "today" correctly regardless of the server's own timezone, we resolve today's
 * calendar date *in Edmonton* and rebuild it as a UTC-midnight `Date`.
 */

export const EDMONTON_TZ = 'America/Edmonton';

/** Calendar parts (y/m/d) for the given instant, evaluated in Edmonton. */
function edmontonParts(instant: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: EDMONTON_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant);

  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  return { year: get('year'), month: get('month'), day: get('day') };
}

/** A YYYY-MM-DD date string (in Edmonton) rebuilt as a UTC-midnight Date for `@db.Date` matching. */
export function edmontonDateToUTC(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/** Today's Edmonton calendar day as a UTC-midnight Date (matches `@db.Date` storage). */
export function edmontonTodayUTC(): Date {
  const { year, month, day } = edmontonParts(new Date());
  return new Date(Date.UTC(year, month - 1, day));
}

/** Today's Edmonton calendar day as a `YYYY-MM-DD` string (for form defaults / inputs). */
export function edmontonTodayISO(): string {
  const { year, month, day } = edmontonParts(new Date());
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
