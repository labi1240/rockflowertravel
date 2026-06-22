'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import {
  type FareDTO,
  type FareTier,
  effectiveUnitPrice,
} from '@/lib/fares';

interface FaresContextValue {
  fares: FareDTO[];
  /** Request-time clock (epoch ms) from the server — used for sale evaluation, hydration-stable. */
  nowMs: number;
  byTier: Record<FareTier, FareDTO[]>;
  /** Cheapest effective (sale-aware) per-seat price per tier, for "from $X" labels. */
  tierFrom: Record<FareTier, number>;
  /** Default fare id to preselect per tier (lowest sortOrder). */
  tierDefault: Record<FareTier, string | undefined>;
  getFare: (id: string) => FareDTO | undefined;
  pauseBookings: boolean;
  pauseMessage: string | null;
}

const FaresContext = createContext<FaresContextValue | null>(null);

const TIER_KEYS: FareTier[] = ['sunrise', 'daytime', 'evening'];

export function FaresProvider({
  fares,
  nowMs,
  pauseBookings = false,
  pauseMessage = null,
  children,
}: {
  fares: FareDTO[];
  nowMs: number;
  pauseBookings?: boolean;
  pauseMessage?: string | null;
  children: ReactNode;
}) {
  const value = useMemo<FaresContextValue>(() => {
    const byTier = { sunrise: [], daytime: [], evening: [] } as Record<FareTier, FareDTO[]>;
    for (const fare of fares) {
      if (byTier[fare.tier]) byTier[fare.tier].push(fare);
      else console.warn(`[FaresProvider] fare "${fare.id}" has unexpected tier "${fare.tier}" — skipped.`);
    }

    const tierFrom = {} as Record<FareTier, number>;
    const tierDefault = {} as Record<FareTier, string | undefined>;
    for (const key of TIER_KEYS) {
      const list = byTier[key];
      tierFrom[key] = list.length
        ? Math.min(...list.map((f) => effectiveUnitPrice(f, nowMs)))
        : 0;
      tierDefault[key] = list[0]?.id;
    }

    const index = new Map(fares.map((f) => [f.id, f]));
    return {
      fares,
      nowMs,
      byTier,
      tierFrom,
      tierDefault,
      getFare: (id: string) => index.get(id),
      pauseBookings,
      pauseMessage,
    };
  }, [fares, nowMs, pauseBookings, pauseMessage]);

  return <FaresContext.Provider value={value}>{children}</FaresContext.Provider>;
}

export function useFares(): FaresContextValue {
  const ctx = useContext(FaresContext);
  if (!ctx) throw new Error('useFares must be used within a <FaresProvider>');
  return ctx;
}
