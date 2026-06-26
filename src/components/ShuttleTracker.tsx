'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BusFront } from 'lucide-react';

interface TrackerState {
  timeString: string;
  activeService: string;
  status: 'en-route' | 'stopped' | 'resting' | 'closed';
  segment: string;
  progressPercent: number;
  fromStation: string;
  toStation: string;
  etaMins: number;
}

const minutesToTimeString = (mins: number): string => {
  const hours = Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const displayMinutes = m < 10 ? `0${m}` : m;
  return `${displayHours}:${displayMinutes} ${ampm}`;
};

const getMountainTimeMinutes = (): number => {
  const edmontonDate = new Date().toLocaleString('en-US', { timeZone: 'America/Edmonton' });
  const localDate = new Date(edmontonDate);
  return localDate.getHours() * 60 + localDate.getMinutes();
};

export default function ShuttleTracker() {
  const [isLive, setIsLive] = useState<boolean>(true);
  const [simMinutes, setSimMinutes] = useState<number>(540);
  const [trackerState, setTrackerState] = useState<TrackerState>({
    timeString: '9:00 AM',
    activeService: 'Daytime Circuit (Circuit 2)',
    status: 'stopped',
    segment: 'Boarding at Samson Mall',
    progressPercent: 0,
    fromStation: 'Samson Mall',
    toStation: 'Lake Louise Lakeshore',
    etaMins: 15,
  });

  const calculateShuttlePosition = useCallback((totalMinutes: number) => {
    const timeString = minutesToTimeString(totalMinutes);
    let activeService = 'No active shuttles';
    let status: TrackerState['status'] = 'closed';
    let segment = 'Depot / overnight parking';
    let progressPercent = 0;
    let fromStation = 'Banff Depot';
    let toStation = 'Banff Depot';
    let etaMins = 0;

    if (totalMinutes >= 270 && totalMinutes < 410) {
      activeService = 'Sunrise Express (Premium)';
      if (totalMinutes < 360) {
        status = 'en-route';
        fromStation = 'Banff'; toStation = 'Moraine Lake';
        progressPercent = Math.min(100, Math.floor(((totalMinutes - 270) / 90) * 100));
        segment = 'Banff to Moraine Lake';
        etaMins = 360 - totalMinutes;
      } else if (totalMinutes < 370) {
        status = 'stopped';
        fromStation = 'Moraine Lake'; toStation = 'Lake Louise Lakeshore';
        progressPercent = 100;
        segment = 'Unloading & boarding at Moraine Lake';
        etaMins = 370 - totalMinutes;
      } else if (totalMinutes < 395) {
        status = 'en-route';
        fromStation = 'Moraine Lake'; toStation = 'Lake Louise Lakeshore';
        progressPercent = Math.min(100, Math.floor(((totalMinutes - 370) / 25) * 100));
        segment = 'Positioning: Moraine Lake to Lake Louise Lakeshore';
        etaMins = 395 - totalMinutes;
      } else {
        status = 'en-route';
        fromStation = 'Lake Louise Lakeshore'; toStation = 'Samson Mall';
        progressPercent = Math.min(100, Math.floor(((totalMinutes - 395) / 15) * 100));
        segment = 'Positioning: Lake Louise Lakeshore to Samson Mall';
        etaMins = 410 - totalMinutes;
      }
    } else if (totalMinutes >= 410 && totalMinutes < 420) {
      activeService = 'Preparing for Daytime Circuit';
      status = 'resting';
      fromStation = 'Samson Mall'; toStation = 'Lake Louise Lakeshore';
      segment = 'Positioning for Daytime Circuit';
      etaMins = 420 - totalMinutes;
    } else if (totalMinutes >= 420 && totalMinutes < 1040) {
      const circuits = [
        { start: 420, label: 'Daytime Circuit 1' },
        { start: 540, label: 'Daytime Circuit 2' },
        { start: 660, label: 'Daytime Circuit 3' },
        { start: 810, label: 'Daytime Circuit 4' },
        { start: 930, label: 'Daytime Circuit 5' },
      ];
      let activeCirc = circuits[0];
      for (const c of circuits) if (totalMinutes >= c.start) activeCirc = c;
      activeService = activeCirc.label;
      const relativeMin = totalMinutes - activeCirc.start;
      if (relativeMin < 15) {
        status = 'en-route';
        fromStation = 'Samson Mall'; toStation = 'Lake Louise Lakeshore';
        progressPercent = Math.min(100, Math.floor((relativeMin / 15) * 100));
        segment = 'Samson Mall to Lake Louise Lakeshore';
        etaMins = 15 - relativeMin;
      } else if (relativeMin < 40) {
        status = 'en-route';
        fromStation = 'Lake Louise Lakeshore'; toStation = 'Moraine Lake';
        progressPercent = Math.min(100, Math.floor(((relativeMin - 15) / 25) * 100));
        segment = 'Lake Louise Lakeshore to Moraine Lake';
        etaMins = 40 - relativeMin;
      } else if (relativeMin < 110) {
        status = 'en-route';
        fromStation = 'Moraine Lake'; toStation = 'Samson Mall';
        progressPercent = Math.min(100, Math.floor(((relativeMin - 40) / 70) * 100));
        segment = 'Moraine Lake to Samson Mall';
        etaMins = 110 - relativeMin;
      } else {
        status = 'resting';
        fromStation = 'Samson Mall'; toStation = 'Lake Louise Lakeshore';
        progressPercent = 100;
        segment = 'Positioning for next circuit';
        const curIndex = circuits.findIndex((c) => c.start === activeCirc.start);
        etaMins = curIndex < circuits.length - 1 ? circuits[curIndex + 1].start - totalMinutes : 1080 - totalMinutes;
      }
    } else if (totalMinutes >= 1040 && totalMinutes < 1080) {
      activeService = 'Preparing for Evening Return';
      status = 'resting';
      fromStation = 'Samson Mall'; toStation = 'Lake Louise Lakeshore';
      progressPercent = Math.min(100, Math.floor(((totalMinutes - 1040) / 40) * 100));
      segment = 'Positioning: Samson Mall to Lake Louise Lakeshore';
      etaMins = 1080 - totalMinutes;
    } else if (totalMinutes >= 1080 && totalMinutes < 1155) {
      activeService = 'Evening Return';
      status = 'en-route';
      fromStation = 'Lake Louise Lakeshore'; toStation = 'Banff';
      progressPercent = Math.min(100, Math.floor(((totalMinutes - 1080) / 75) * 100));
      segment = 'Lake Louise Lakeshore to Banff';
      etaMins = 1155 - totalMinutes;
    } else {
      activeService = 'Service closed';
      status = 'closed';
      segment = 'Services ended for the day';
      etaMins = totalMinutes < 270 ? 270 - totalMinutes : 1440 - totalMinutes + 270;
    }

    setTrackerState({ timeString, activeService, status, segment, progressPercent, fromStation, toStation, etaMins });
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isLive) {
      const updateTracker = () => calculateShuttlePosition(getMountainTimeMinutes());
      updateTracker();
      const interval = setInterval(updateTracker, 30000);
      return () => clearInterval(interval);
    } else {
      calculateShuttlePosition(simMinutes);
    }
  }, [isLive, simMinutes, calculateShuttlePosition]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const statusMeta: Record<TrackerState['status'], { label: string; tone: string }> = {
    'en-route': { label: 'En route',  tone: 'bg-sunrise-100 text-sunrise-700 dark:bg-sunrise-500/15 dark:text-sunrise-300' },
    stopped:    { label: 'Boarding',  tone: 'bg-evergreen-100 text-evergreen-700 dark:bg-evergreen-500/15 dark:text-evergreen-300' },
    resting:    { label: 'Layover',   tone: 'bg-mist-100 text-mist-700 dark:bg-mist-700/30 dark:text-mist-200' },
    closed:     { label: 'Closed',    tone: 'bg-mist-100 text-mist-500 dark:bg-mist-800/40 dark:text-mist-400' },
  };

  return (
    <section id="tracker" className="relative mx-auto max-w-7xl px-6 pb-24">
      {/* Live module overlaps the hero seam (book: Overlap elements to create layers) */}
      <div className="mx-auto -mt-24 max-w-4xl overflow-hidden rounded-3xl bg-white shadow-[var(--shadow-elevated)] dark:bg-evergreen-900 lg:-mt-32">
        <div className="h-1 w-full bg-gradient-to-r from-sunrise-500/0 via-sunrise-500 to-sunrise-500/0" />
        <h2 id="tracker-heading" className="sr-only">Where&apos;s the shuttle right now?</h2>
        {/* Header strip */}
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div>
            <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-mist-500 dark:text-mist-300">
              <span className={`size-2 rounded-full ${isLive ? 'bg-emerald-500 shadow-[0_0_0_3px_hsl(160_84%_50%/0.25)] animate-pulse' : 'bg-sunrise-400 shadow-[0_0_0_3px_hsl(41_80%_50%/0.25)]'}`} />
              {isLive ? 'Live' : 'Simulation'}
            </span>
            <div className="mt-2 font-display text-4xl font-extrabold tabular-nums text-mist-900 dark:text-white sm:text-5xl">
              {trackerState.timeString}
            </div>
          </div>

          <div className="inline-flex rounded-xl border border-mist-200 bg-mist-50 p-1 dark:border-evergreen-700/40 dark:bg-evergreen-950/40">
            <ToggleButton active={isLive} onClick={() => setIsLive(true)}>Live time</ToggleButton>
            <ToggleButton active={!isLive} onClick={() => setIsLive(false)}>Simulator</ToggleButton>
          </div>
        </div>

        {/* Simulator */}
        {!isLive && (
          <div className="border-b border-mist-200 px-6 py-5 dark:border-evergreen-700/40 sm:px-7">
            <div className="mb-3 flex justify-between text-[11px] font-semibold uppercase tracking-[0.12em] text-mist-500 dark:text-mist-500">
              <span>4:30 AM</span>
              <span>Noon</span>
              <span>6:00 PM</span>
              <span>8:00 PM</span>
            </div>
            <input
              type="range"
              min={240}
              max={1230}
              step={5}
              value={simMinutes}
              onChange={(e) => setSimMinutes(parseInt(e.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-mist-200 accent-sunrise-500 dark:bg-evergreen-800"
            />
            <div className="mt-3 text-center text-sm text-mist-500 dark:text-mist-300">
              Simulating <strong className="font-display text-mist-900 dark:text-white">{minutesToTimeString(simMinutes)}</strong>
            </div>
          </div>
        )}

        {/* Progress segment */}
        <div className="px-6 pb-12 pt-4 sm:px-10">
          <div className="relative mx-auto max-w-lg">
            <div className="flex justify-between gap-4">
              <Stop label={trackerState.fromStation} align="left" />
              <Stop label={trackerState.toStation} align="right" />
            </div>
            <div className="relative mt-4 h-9">
              <div className="absolute inset-x-4 top-1/2 h-2 -translate-y-1/2 rounded-full bg-mist-200 dark:bg-evergreen-800" />
              <div
                className="absolute top-1/2 left-4 h-2 -translate-y-1/2 rounded-full bg-sunrise-500 shadow-[0_0_0_4px_hsl(41_78%_50%/0.12)] transition-[width] duration-500 ease-out"
                style={{ width: `calc(${trackerState.status === 'closed' ? 0 : trackerState.progressPercent}% - 2rem * ${trackerState.progressPercent / 100})` }}
              />
              <span aria-hidden className="absolute left-0 top-1/2 size-4 -translate-y-1/2 rounded-full border-2 border-evergreen-700 bg-white dark:border-sunrise-400 dark:bg-evergreen-900" />
              <span aria-hidden className="absolute right-0 top-1/2 size-4 -translate-y-1/2 rounded-full border-2 border-evergreen-700 bg-white dark:border-sunrise-400 dark:bg-evergreen-900" />
              {trackerState.status !== 'closed' && (
                <div
                  className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 text-evergreen-800 transition-[left] duration-500 ease-out dark:text-sunrise-400"
                  style={{
                    left: `calc(1rem + (100% - 2rem) * ${trackerState.progressPercent / 100})`,
                    animation: trackerState.status === 'en-route' ? 'busDrive 0.6s infinite ease' : 'none',
                  }}
                  aria-hidden
                >
                  <BusFront className="size-8 drop-shadow-md" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Telemetry — value first, label is supporting */}
        <div className="grid grid-cols-1 gap-8 bg-mist-50/70 px-6 py-7 dark:bg-evergreen-950/30 sm:grid-cols-2 sm:px-7 lg:grid-cols-[1.4fr_1.6fr_0.8fr_0.9fr]">
          <Telemetry label="Active service" value={trackerState.activeService} />
          <Telemetry label="Current sector" value={trackerState.segment} />
          <div>
            <p className="font-display text-base font-bold leading-snug text-mist-900 dark:text-white">
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${statusMeta[trackerState.status].tone}`}>
                {statusMeta[trackerState.status].label}
              </span>
            </p>
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-mist-500 dark:text-mist-500">Status</p>
          </div>
          <div>
            <p className="font-display text-2xl font-extrabold tabular-nums text-mist-900 dark:text-white">
              {trackerState.status === 'closed'
                ? `${Math.floor(trackerState.etaMins / 60)}h ${trackerState.etaMins % 60}m`
                : <>{trackerState.etaMins}<span className="ml-1 text-base font-bold text-mist-500 dark:text-mist-500">min</span></>}
            </p>
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-mist-500 dark:text-mist-500">
              {trackerState.status === 'closed' ? 'Next departure' : 'Arrives in'}
            </p>
          </div>
        </div>
      </div>

      <p className="mx-auto mt-6 max-w-md text-center text-sm text-mist-500 dark:text-mist-300">
        Live position in Mountain Time. Switch to <strong className="font-semibold text-mist-700 dark:text-white">Simulator</strong> to scrub any moment of the day.
      </p>
    </section>
  );
}

function ToggleButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
        active
          ? 'bg-white text-mist-900 shadow-sm dark:bg-evergreen-700 dark:text-white'
          : 'text-mist-500 hover:text-mist-900 dark:text-mist-400 dark:hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

function Stop({ label, align }: { label: string; align: 'left' | 'right' }) {
  return (
    <div className={`flex flex-col gap-2 ${align === 'right' ? 'items-end text-right' : 'items-start text-left'}`}>
      <span className="font-display text-sm font-bold text-mist-900 dark:text-white">{label}</span>
    </div>
  );
}

function Telemetry({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-display text-base font-bold leading-snug text-mist-900 dark:text-white">{value}</p>
      <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-mist-500 dark:text-mist-500">{label}</p>
    </div>
  );
}
