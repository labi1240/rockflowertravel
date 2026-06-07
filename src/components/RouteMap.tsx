import RouteMapInteractive from '@/components/RouteMapInteractive';

export default function RouteMap() {
  return (
    <section id="map" className="mx-auto max-w-7xl px-6 py-24">
      <header className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-4xl font-extrabold leading-[1.02] tracking-tighter text-mist-900 sm:text-5xl">
          Where we go
        </h2>
        <p className="mt-4 text-base text-mist-500">
          Four stops, three services. Tap a stop to see loading bays and departure notes.
        </p>
      </header>

      <RouteMapInteractive />
    </section>
  );
}
