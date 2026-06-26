import type { Payload } from 'payload'

/**
 * Seeds a full SEO landing page onto the `sunrise-express` route — demonstrates
 * every content block so the admin layout builder has a real reference. Idempotent:
 * re-running overwrites the landing fields on the matched route. Run with:
 *
 *   pnpm exec tsx --env-file=.env src/seed/landing-run.ts
 */
export async function seedLanding(payload: Payload) {
  const { docs } = await payload.find({
    collection: 'routes',
    where: { slug: { equals: 'sunrise-express' } },
    limit: 1,
    overrideAccess: true,
  })
  const route = docs[0]
  if (!route) {
    console.warn('[seedLanding] route "sunrise-express" not found — run the catalog seed first.')
    return
  }

  await payload.update({
    collection: 'routes',
    id: route.id,
    overrideAccess: true,
    data: {
      seoSlug: 'sunrise-banff-moraine-lake-tour',
      _status: 'published',
      seo: {
        metaTitle: 'Sunrise at Moraine Lake — Banff Shuttle Tour | RockFlower Travels',
        metaDescription:
          'Catch first light over the Valley of the Ten Peaks. Premium 4:30 AM Sunrise Express from Banff direct to Moraine Lake — reserved seats, no driving stress, on-time guarantee.',
      },
      hero: {
        badge: 'Premium service',
        headline: 'Sunrise at Moraine Lake',
        subheadline:
          'Beat the crowds and the driving stress. Our premium 4:30 AM Sunrise Express runs Banff direct to Moraine Lake so you arrive for first light over the Ten Peaks.',
        ratingValue: 4.9,
        ratingCount: 1487,
        ratingSource: 'Google',
      },
      layout: [
        {
          blockType: 'highlights',
          heading: 'Why travellers love this trip',
          items: [
            { text: 'Departs Banff at 4:30 AM — first light at Moraine Lake' },
            { text: 'Premium isolated service — runs apart from the standard loops' },
            { text: 'Skip the Parks Canada vehicle ban and the driving stress' },
            { text: 'Local drivers handle the mountain roads while you relax' },
            { text: 'Reserved coach seating — your seat is guaranteed' },
            { text: 'Free changes up to 24 hours before departure' },
          ],
        },
        {
          blockType: 'featureGrid',
          heading: 'Ride with the #1 sunrise shuttle',
          subheading: 'More departure flexibility, no lines, and a locally owned team.',
          features: [
            { icon: 'clock', title: 'More travel options', body: 'Convenient pick-up and drop-off with more departure times than any other service.' },
            { icon: 'shield', title: 'No waiting in lines', body: 'Your seat is reserved — never wait in line to or from Moraine Lake.' },
            { icon: 'calendar', title: 'Flexible booking', body: 'Change your date or time up to 24 hours before your scheduled shuttle.' },
          ],
        },
        {
          blockType: 'inclusions',
          heading: "What's included",
          includes: [
            { text: 'Round-trip OR one-way reserved coach seat' },
            { text: 'Professional local driver' },
            { text: 'Direct Banff → Moraine Lake routing' },
            { text: 'Air-conditioned, seat-belted vehicle' },
          ],
          excludes: [
            { text: 'Parks Canada park pass (required, buy separately)' },
            { text: 'Food and beverages' },
            { text: 'Gratuities' },
            { text: 'Hotel pickup outside listed stops' },
          ],
        },
        {
          blockType: 'itinerary',
          heading: 'Your morning, hour by hour',
          steps: [
            { title: 'Banff departure', description: 'Board the premium Sunrise Express in Banff. Arrive 10 minutes early — the bus leaves on time.', duration: '4:30 AM' },
            { title: 'Drive to Moraine Lake', description: 'Settle in for the scenic transfer up the Bow Valley Parkway corridor as the sky lightens.', duration: '~1 hr 30 min' },
            { title: 'First light at Moraine Lake', description: 'Arrive for sunrise over the Valley of the Ten Peaks. Walk the Rockpile Trail for the classic viewpoint.', duration: '6:00 AM' },
            { title: 'Explore the shoreline', description: 'Rent a canoe, hike a lakeside trail, or grab a coffee at the lodge before your return shuttle.', duration: 'Stop: flexible' },
          ],
        },
        {
          blockType: 'routeMap',
          heading: 'Where we go',
          subheading: 'Banff → Lake Louise → Moraine Lake. Tap a stop to see loading bays and departure notes.',
        },
        {
          blockType: 'thingsToDo',
          heading: 'Favourite things to do at Moraine Lake',
          intro: "When you arrive there's plenty to do for all ages, abilities, and interests. Here are some of our favourites:",
          items: [
            { text: 'Walk the short, easy Rockpile Trail to the iconic viewpoint' },
            { text: 'Hike one of many trails that start at the lake' },
            { text: 'Rent a canoe and paddle across the glacial water' },
            { text: 'Visit the Moraine Lake Trading Post for souvenirs' },
            { text: 'Watch for wildlife — marmots, chipmunks, and native birds' },
            { text: 'Grab lunch at the lodge café and relax on the patio' },
          ],
        },
        {
          blockType: 'testimonials',
          heading: 'What sunrise riders are saying',
          reviews: [
            { name: 'Adarsh M.', location: 'Toronto, ON', rating: 5, text: 'The shuttle was clean and on time, and the drivers were super friendly. They made us feel welcome and safe — you can tell they care about the people on the bus.' },
            { name: 'Jenn A.', location: 'Seattle, WA', rating: 5, text: 'Fantastic experience! Reservations were easy and I loved that the return time could be adjusted. Great communication, clean nice buses.' },
            { name: 'Ava A.', location: 'Calgary, AB', rating: 5, text: 'Very easy to book 2 days before. Straightforward pickup and kind, energetic drivers. Locally owned, no tourist-trap vibe — highly recommend.' },
          ],
        },
        {
          blockType: 'faq',
          heading: 'Frequently asked',
          items: [
            { question: 'Are prices one-way or round-trip?', answer: 'The Sunrise Express is sold per seat. Choose your trip above — one-way and round-trip options are priced separately and shown live before you pay.' },
            { question: 'Do I need a Parks Canada pass?', answer: 'Yes. A valid Parks Canada park pass is required to enter Banff National Park and is not included in the shuttle fare. Buy one in advance or at the park gates.' },
            { question: 'Can I drive my personal vehicle to Moraine Lake?', answer: 'No. Personal vehicles are not permitted on Moraine Lake Road, and client parking at public lands like Lake Louise Lakeshore is strictly prohibited. A shuttle is the reliable way to reach the lake.' },
            { question: 'What if I miss the bus?', answer: 'Shuttles depart strictly on time. If you miss your departure your ticket is void, though we will try to accommodate you on a later shuttle if space permits.' },
            { question: 'Can I change my reservation to another day?', answer: 'Yes — you can change your date or time up to 24 hours before departure, subject to availability.' },
          ],
        },
        {
          blockType: 'cta',
          heading: 'Plan ahead & book your sunrise shuttle today',
          body: 'Seats fill quickly for first light at Moraine Lake. Reserve your spot and let us handle the early start.',
          buttonLabel: 'Book the Sunrise Express',
        },
      ],
    },
  })

  console.log('[seedLanding] sunrise-express landing page published at /sunrise-banff-moraine-lake-tour')
}
