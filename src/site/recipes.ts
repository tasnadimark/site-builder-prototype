// The page rule: which kind of business gets which pages. This is data, not components.
// Supporting another kind of business means adding an entry here, nothing else.
//
// Every site is built from the same page roles (home, offer, approach, proof, people,
// contact, location). A kind of business decides which roles get a page of their own
// and which stay a section on Home.

import type { PageRole } from './vocab';

type PageSpec = { role: Exclude<PageRole, 'home' | 'location'>; en: string; hu: string; holds: string };

export type BusinessKind = {
  id: string;
  /** Shown in the "Business type" list. */
  label: string;
  examples: string;
  /** Pages besides Home, in menu order. */
  pages: PageSpec[];
  /** What stays a section on Home instead of becoming a page. */
  onHome: string;
};

const contact = (en: string, hu: string, holds = 'a contact block for the location with its map, and an enquiry form'): PageSpec => ({ role: 'contact', en, hu, holds });

export const BUSINESS_KINDS: BusinessKind[] = [
  {
    id: 'beauty',
    label: 'Beauty and wellness',
    examples: 'hairdresser, barber, beautician, nail studio, massage',
    pages: [
      { role: 'offer', en: 'Services and prices', hu: 'Szolgáltatások és árak', holds: 'the full price list as rows, grouped by type of treatment' },
      contact('Contact and booking', 'Kapcsolat és időpontfoglalás'),
    ],
    onHome: 'gallery of work, the team, reviews',
  },
  {
    id: 'health',
    label: 'Health practitioner',
    examples: 'physiotherapist, psychologist, dietitian, personal trainer',
    pages: [
      { role: 'offer', en: 'Services and prices', hu: 'Szolgáltatások és árak', holds: 'what is treated, how a session runs, prices as rows' },
      { role: 'people', en: 'About and method', hu: 'Rólam és a módszerről', holds: 'qualifications, experience and the way of working' },
      contact('Contact and booking', 'Kapcsolat és időpontfoglalás'),
    ],
    onHome: 'reviews',
  },
  {
    id: 'studio',
    label: 'Studio',
    examples: 'yoga, pilates, dance, gym, group training',
    pages: [
      { role: 'offer', en: 'Classes and timetable', hu: 'Órák és órarend', holds: 'the kinds of class, the weekly timetable as rows grouped by day, passes and prices' },
      { role: 'people', en: 'Our coaches', hu: 'Oktatóink', holds: 'one person block per coach' },
      { role: 'approach', en: 'Methodology', hu: 'Módszerünk', holds: 'the approach, who it suits, what a first class is like' },
      contact('Contact and booking', 'Kapcsolat és jelentkezés'),
    ],
    onHome: 'reviews',
  },
  {
    id: 'consultant',
    label: 'Consultant, coach or teacher',
    examples: 'HR or finance consultant, business coach, language teacher, tutor',
    pages: [
      { role: 'offer', en: 'Services', hu: 'Szolgáltatások', holds: 'services or packages, who each is for' },
      { role: 'people', en: 'About and method', hu: 'Rólam és a módszerről', holds: 'background, credentials and the way of working' },
      contact('Contact', 'Kapcsolat'),
    ],
    onHome: 'references and reviews',
  },
  {
    id: 'trades',
    label: 'Trades',
    examples: 'electrician, air conditioning, plumber, tiler, painter',
    pages: [
      { role: 'offer', en: 'Services', hu: 'Szolgáltatások', holds: 'each service, typical prices as rows, how a job runs' },
      contact('Contact and quote', 'Kapcsolat és ajánlatkérés', 'a quote request form, a contact block, and the areas covered as a checklist'),
    ],
    onHome: 'references, reviews, a short introduction of the tradesperson',
  },
  {
    id: 'hospitality',
    label: 'Café, bistro or pastry shop',
    examples: 'café, bistro, restaurant, bakery, pastry shop',
    pages: [
      { role: 'offer', en: 'Menu', hu: 'Étlap', holds: 'the menu as rows, grouped by course or kind' },
      contact('Find us', 'Elérhetőség', 'a contact block with opening hours and map, and a table booking form'),
    ],
    onHome: 'gallery, the story of the place',
  },
  {
    id: 'creative',
    label: 'Creative and events',
    examples: 'photographer, videographer, interior designer, wedding planner, florist',
    pages: [
      { role: 'proof', en: 'Portfolio', hu: 'Munkáink', holds: 'finished work as images, in a bento or grid' },
      { role: 'offer', en: 'Packages', hu: 'Csomagok', holds: 'packages as plans, what each includes' },
      { role: 'people', en: 'About', hu: 'Rólam', holds: 'who is behind the work and how they work' },
      contact('Contact', 'Kapcsolat', 'an enquiry form with a date field, and a contact block'),
    ],
    onHome: 'reviews',
  },
  {
    id: 'b2b',
    label: 'Local business services',
    examples: 'accountant, cleaning company, landscaper, IT support',
    pages: [
      { role: 'offer', en: 'Services', hu: 'Szolgáltatások', holds: 'each service, who it is for' },
      { role: 'people', en: 'About', hu: 'Rólunk', holds: 'the team, experience, certifications' },
      contact('Contact and quote', 'Kapcsolat és ajánlatkérés', 'a quote request form and a contact block'),
    ],
    onHome: 'references and client logos',
  },
];

/** Finer guidance for specific businesses. Written from what such a site has to achieve. */
const RECIPES = `
Hairdresser or salon (kind "beauty")
- Visitors want: can I get the cut or colour I want, what does it cost, when can I come.
- Home: hero with a picture of the salon and a "book" button; a rating block; four to six of the most asked-for services as rows with "from" prices and a link to the full list; the stylists as person blocks; a bento of finished hair; reviews as quotes with stars; a contact block.
- Services and prices: rows in a two-column grid, grouped (women, men, colour, treatments), with the duration in "detail" and the price in "value".
- Pictures: the salon interior, hair seen from behind or the side, hands at work.

Electrician or other tradesperson (kind "trades")
- Visitors want: do you do this job, do you come to my area, can I trust you, how fast. Then they call.
- The main button everywhere is a phone call: href "tel:" plus the number. The second is "request a quote".
- Home: hero stating the trade, the area and a promise (for example same-week appointments); a row of check blocks for what makes them safe to hire (licensed, insured, written quote, guarantee); the main jobs as cards with icons; references as images or quotes with stars; the areas covered as check blocks; a contact block.
- Services: one card or row per job with a typical price, then steps for how a job runs, then a short FAQ.
- Pictures: tidy finished work (a fuse board, neat cabling, fitted lights), tools, a van. Never a posed stock-photo smile.

Yoga or pilates studio (kind "studio")
- Visitors want: is there a class for my level, when is it, who teaches, what does a first class cost.
- Home: calm hero with a "try a first class" button; the kinds of class as cards; three coaches as person blocks linking to the coaches page; the approach in three steps; passes as plans; reviews; a contact block.
- Classes and timetable: the timetable as rows grouped by day (title = class, detail = coach and level, value = time), in a three-column grid; then passes and prices.
- Our coaches: one person block per coach, each with a portrait image.
- With several studios: one "location" page per studio, sharing the group "Stúdióink" / "Our studios". Each carries a contact block for that studio and that studio's own timetable as rows.
- Pictures: the room and its light, mats and props, people practising seen from a distance. Calm colours.
`.trim();

const pageLine = (k: BusinessKind) =>
  `- "${k.id}" (${k.examples}): ${k.pages.map((p) => `${p.en} / ${p.hu} [${p.role}: ${p.holds}]`).join('; ')}. On Home instead of a page: ${k.onHome}.`;

/** The page rule as the model reads it. */
export const pageRuleText = () =>
  `
# Pages
A site has a Home page and usually a few more. Which ones depends on the kind of business. Pick the kind that fits the brief and use its pages, with the page titles in the site's language (English / Hungarian titles are given).

${BUSINESS_KINDS.map(pageLine).join('\n')}

Adjust for the business in front of you:
- Too little to say: if a page would hold fewer than two real sections, leave it out and put its content on Home. A one-person business with a handful of services can be a single page.
- A lot to say: more than about 12 price rows, or 3 or more people, earns its own page even where the list above keeps it on Home.
- Finished work is the product (interior or home design, landscaping, tiling and renovation, photography): add a page with role "proof" titled "Our work" / "Munkáink". Everyone else keeps references on Home.
- Two or more locations: give each its own page with role "location" and the same "group" (for example "Locations" / "Helyszínek"), holding a contact block for that location and anything that differs there, such as its timetable. Pages that share a group become one dropdown in the menu. With one location there are no location pages.
- The menu shows at most five entries, and a dropdown counts as one. Do not write nav links: the menu is built from the pages.
- Every page ends with a short "cta" section carrying the site's main action.
- Do not write privacy or company-details pages. They are generated from the business facts.

${RECIPES}
`.trim();
