import { create } from 'zustand';
import type { FareId } from '@/lib/fares';

// Booking selection is keyed by fare product (origin → destination + tier), the
// single source of truth in src/lib/fares.ts. Kept as an alias so existing imports
// of `BookingRouteId` keep working.
export type BookingRouteId = FareId;

const DEFAULT_FARE: FareId = 'daytime-samson-ll';

interface BookingModalOpenOptions {
  date?: string;
  passengers?: number;
}

interface BookingModalState {
  isOpen: boolean;
  initialRoute: BookingRouteId;
  initialDate?: string;
  initialPassengers?: number;
  open: (route?: BookingRouteId, opts?: BookingModalOpenOptions) => void;
  close: () => void;
}

export const useBookingModal = create<BookingModalState>((set) => ({
  isOpen: false,
  initialRoute: DEFAULT_FARE,
  initialDate: undefined,
  initialPassengers: undefined,
  open: (route = DEFAULT_FARE, opts) =>
    set({
      isOpen: true,
      initialRoute: route,
      initialDate: opts?.date,
      initialPassengers: opts?.passengers,
    }),
  close: () => set({ isOpen: false }),
}));
