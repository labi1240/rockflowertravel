'use client';

import { motion } from 'motion/react';
import { LightRays } from '@/components/ui/light-rays';
import HeroBookingForm from '@/components/HeroBookingForm';

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      <LightRays />

      <video
        autoPlay
        loop
        muted
        playsInline
        preload="none"
        poster="/images/hero_banner.jpg"
        aria-hidden="true"
        className="absolute inset-0 -z-10 size-full object-cover"
      >
        <source src="/hero_video.mp4" type="video/mp4" />
      </video>
      {/* Cream scrim: near-opaque on the left so dark text stays legible, fading
          right to reveal the mountain video; vertical layer softens the top for the
          navbar and melts the bottom into the cream page below. */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-mist-50 via-mist-50/85 to-mist-50/25" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-mist-50/60 via-transparent to-mist-50" />

      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 px-4 pb-20 pt-24 sm:gap-12 sm:px-6 sm:pb-28 sm:pt-28 md:pb-40 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 lg:pb-48 lg:pt-32">
        {/* Left — narrative */}
        <motion.div 
          initial="hidden" 
          animate="visible" 
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
          }}
          className="max-w-2xl text-mist-700"
        >
          <motion.span
            variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
            className="inline-flex items-center gap-2 rounded-full border border-evergreen-700/20 bg-evergreen-700/5 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-evergreen-700"
          >
            <span aria-hidden className="size-1.5 rounded-full bg-sunrise-400" />
            Premium Rocky Mountain Shuttles
          </motion.span>

          <motion.h1 
            variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
            className="mt-6 font-display text-4xl font-extrabold leading-[0.98] tracking-tighter text-balance text-mist-900 sm:text-5xl lg:text-[3.75rem]"
          >
            <span className="mb-3 block text-xs font-semibold uppercase tracking-[0.22em] text-mist-500 sm:text-sm">Banff to</span>
            <span className="block text-evergreen-800">Lake Louise <span className="text-mist-400">&amp;</span> Moraine Lake</span>
          </motion.h1>

          <motion.p 
            variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
            className="mt-6 max-w-xl text-base leading-relaxed text-mist-700 sm:text-lg"
          >
            Reliable, scenic, premium daily transit. Beat the parking crowds and travel in
            absolute comfort on our state-of-the-art shuttle coaches.
          </motion.p>

          <motion.ul 
            variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
            className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-sm text-mist-700"
          >
            <li className="inline-flex items-center gap-2">
              <span aria-hidden className="text-sunrise-500">✦</span>
              <span className="font-medium">Sunrise access at 4:30&nbsp;AM</span>
            </li>
            <li className="inline-flex items-center gap-2">
              <span aria-hidden className="text-sunrise-500">✦</span>
              <span className="font-medium">Buses depart on time</span>
            </li>
            <li className="inline-flex items-center gap-2">
              <span aria-hidden className="text-sunrise-500">✦</span>
              <span className="font-medium">Reserved seating</span>
            </li>
          </motion.ul>
        </motion.div>

        {/* Right — booking card (client island) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.6, type: 'spring' }}
          className="w-full"
        >
          <HeroBookingForm />
        </motion.div>
      </div>
    </section>
  );
}
