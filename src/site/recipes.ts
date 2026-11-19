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
      { role: 'proof', en: 'Portfolio', hu: 'Munkáink', holds: 'finished work as project blocks, one per job, each with its own two to four pictures and a sentence; before-and-after pairs where the work changed something' },
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

/**
 * Finer guidance for specific businesses. Written from what such a site has to achieve.
 * A recipe says what a site of that type should hold. It does not fix the order: what
 * Home leads with is drawn per site (direction.ts) and can be moved afterwards.
 */
const RECIPES = `
# Recipes
When the business matches one of these, build from its recipe: Home holds every item the recipe lists (in whatever order the direction asks for) and the blocks it names are the ones used. A recipe outranks the general habits above; the brief outranks the recipe.

Hairdresser or salon (kind "beauty")
- Visitors want: can I get the cut or colour I want, what does it cost, when can I come.
- Home: hero with a picture of the salon and a "book" button; a rating block; four to six of the most asked-for services as rows with "from" prices and a link to the full list; the stylists as person blocks; a bento of finished hair; reviews as quotes with stars; a contact block.
- Services and prices: rows in a two-column grid, grouped (women, men, colour, treatments), with the duration in "detail" and the price in "value".
- Pictures: the salon interior, hair seen from behind or the side, hands at work.

Beautician or cosmetic studio (kind "beauty")
- Visitors want: which treatment suits my skin, what does it cost, how long does it take, can I trust the person.
- Home holds: the most asked-for treatments as rows with duration and "from" prices; results as a "gallery" section of two "beforeafter" blocks (layout grid, 2 columns), each showing the same face or skin area before and after a course of treatment; who treats you as a person block with their qualifications; reviews; a contact block.
- Services and prices: rows grouped by kind of treatment (facials, waxing, lashes and brows, body), duration in "detail", price in "value".
- Pictures: the treatment room, hands at work, calm close-ups of skin. Never a retouched advertising face.

Nail studio (kind "beauty")
- Visitors choose by the look of the work. Finished nails are the product.
- Home holds: a gallery of finished nails early on, as image blocks in a bento or marquee; the services as rows with prices (gel polish, extensions, manicure, pedicure, nail art); a short section on hygiene and materials as check blocks; reviews; a contact block.
- Pictures: close-ups of hands and nails, one design per picture, plain backgrounds.

Masseur or massage studio (kind "beauty")
- Visitors want: which massage helps my problem, what is a first visit like, what does it cost.
- Home holds: the kinds of massage as cards or rows with duration and price; how a visit runs as steps; passes and gift vouchers as plans; when not to come, as a short FAQ; reviews; a contact block.
- Pictures: the room, the table, towels and oils, hands on a back or shoulder. No faces.

Photographer or videographer (kind "creative")
- Visitors want: do I like this style, what do I get for the money, is my date free.
- Home holds: a hero that is mostly picture; work as "project" blocks, one per kind of shoot (a wedding, a family, a portrait session); how a shoot runs as steps; packages as plans, each saying hours, number of edited pictures and delivery time; reviews.
- Portfolio: one project block per shoot, each with three or four images of that one shoot.
- Pictures: describe the photograph itself (the couple, the light, the place), not a photographer at work.

Interior designer (kind "creative")
- Visitors want: do I like their taste, have they done a home like mine, how does working together go, what does it cost.
- Home holds: two or three finished homes as "project" blocks; a "gallery" section of two "beforeafter" blocks showing rooms that were transformed; the process as steps; packages as plans; reviews.
- Portfolio: one project block per home, tag = kind of home and size, with the main room first.
- Pictures: finished rooms without people, daylight, the whole room and then details.

Wedding planner or decorator (kind "creative")
- Visitors want: proof from real weddings, what is included at each level, is my date free.
- Home holds: past weddings as "project" blocks (tag = place and season); what is included at each level as plans (full planning, partial planning, coordination on the day); the path from first call to the day as steps; words from couples as quotes.
- The main button asks about a date: it leads to the enquiry form, which has a date field.
- Pictures: tables, flowers, the venue, guests seen from a distance. Never a posed stock-photo couple.

Accountant or bookkeeper (kind "b2b")
- Visitors are owners of small businesses. They want: do you handle my kind of company, what does it cost per month, will someone answer when I call.
- Home holds: who it is for as cards (sole traders, small companies, new businesses); monthly packages as plans; what is included as check blocks; how changing accountant works as steps; the team as person blocks with their qualifications and registration; references as quotes.
- Pictures: a calm office, people at a desk with papers and a laptop. Never a stock-photo handshake.

Cleaning company (kind "b2b")
- Visitors want: what do you clean and how often, what does it cost, are the staff insured and vetted, can I trust you with the keys.
- Home holds: the services as cards (offices, stairwells, after renovation, windows); how pricing works as rows; the guarantees as check blocks (insured, vetted staff, own equipment, cover when someone is ill); a "gallery" section of two "beforeafter" blocks; the kinds of client served as stats or quotes; the areas covered as check blocks.
- Pictures: clean, bright rooms and stairwells, equipment, staff seen from a distance.

Landscaper or garden builder (kind "b2b")
- Finished work is the product. Pages: Home, Services, Our work / Munkáink (role "proof", one "project" block per garden), About, Contact and quote.
- Visitors want: have you built a garden like the one I want, how does it go and what does it cost, who looks after it afterwards.
- Home holds: finished gardens as "project" blocks (tag = kind of garden and size); a "gallery" section of two "beforeafter" blocks; the services as cards (design, building, irrigation, lawn, upkeep); the steps from survey to aftercare; reviews.
- Pictures: finished gardens in daylight, whole views first, then details of paving, planting and water.

HR consultant (kind "consultant")
- Visitors are owners and managers of companies. They want: which of my problems do you solve, have you worked with firms like mine, how do we start.
- The main button books a first call.
- Home holds: the problems solved as cards (hiring, keeping people, appraisals, employment law); the ways of working together as plans or cards (a project, a monthly retainer); how an engagement runs as steps; the consultant as a person block with their background; client references as quotes.
- Pictures: the consultant at work, a workshop seen from the side. Never a stock-photo boardroom.

Financial adviser (kind "consultant")
- Visitors want: can I trust you, how are you paid, what will I actually get.
- The main button books a first conversation.
- Home holds: the questions answered as cards (savings, a home loan, insurance, retirement); how advice works as steps; fees stated plainly as rows or plans; licence and registration as check blocks; the adviser as a person block; reviews.
- Never promise returns or name a figure a client will earn.
- Pictures: a calm conversation at a table, documents, a notebook.

Language teacher or tutor (kind "consultant")
- Visitors want: do you teach my level or exam, when, what does a lesson cost, online or in person.
- The main button books a trial lesson.
- Home holds: who the lessons are for as cards (beginners returning, exam preparation, business language); lesson formats and prices as rows or plans (single lesson, pass, small group); how the trial lesson works as steps; the teacher as a person block with qualifications; results as stats; reviews from students.
- Pictures: a lesson in progress, books and notes, an online call.

Electrician or other tradesperson (kind "trades")
- Visitors want: do you do this job, do you come to my area, can I trust you, how fast. Then they call.
- The main button everywhere is a phone call: href "tel:" plus the number. The second is "request a quote".
- Home: hero stating the trade, the area and a promise (for example same-week appointments); a row of check blocks for what makes them safe to hire (licensed, insured, written quote, guarantee); the main jobs as cards with icons; references as images or quotes with stars; the areas covered as check blocks; a contact block.
- Services: one card or row per job with a typical price, then steps for how a job runs, then a short FAQ.
- Pictures: tidy finished work (a fuse board, neat cabling, fitted lights), tools, a van. Never a posed stock-photo smile.

Air-conditioning installer (kind "trades")
- Visitors want: which unit suits my home, what does it cost installed, how soon can you come, do you service it afterwards.
- The main button is a phone call; the second is "request a quote".
- Home holds: the main jobs as cards (installation, cleaning and maintenance, repair, heating with a heat pump); typical installed prices by size of room as rows; how a job runs as steps (survey, quote, installation in a day); what makes them safe to hire as check blocks (certified, warranty, written quote); reviews; the areas covered as check blocks.
- Pictures: neatly fitted indoor and outdoor units, tidy pipe covers, a technician's hands at work.

Tiler (kind "trades")
- Finished work is the product. Pages: Home, Services, Our work / Munkáink (role "proof", one "project" block per job), Contact and quote.
- Visitors want: is the work neat, have they done a room like mine, what is the price per square metre, when can they start.
- Home holds: finished rooms as "project" blocks (tag = kind of room and size); a "gallery" section of two "beforeafter" blocks; what they tile as cards (bathroom, kitchen, floors, terrace); prices per square metre as rows; how a job runs as steps; reviews.
- Pictures: finished tiled surfaces in daylight, then close-ups of joints, corners and edges.

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
A site has a Home page and the pages of its kind of business, never fewer. Pick the kind that fits the brief and use its pages, with the page titles in the site's language (English / Hungarian titles are given).

${BUSINESS_KINDS.map(pageLine).join('\n')}

Adjust for the business in front of you:
- Every business gets all the pages of its kind, however small it is and however short the brief. The owner is not a web expert and is not expected to know what a site needs: give them the complete site and let them correct it. Where the brief says little, write each page from what such a business usually offers.
- A lot to say: more than about 12 price rows, or 3 or more people, earns its own page even where the list above keeps it on Home.
- Finished work is the product (interior or home design, landscaping, tiling and renovation, photography): add a page with role "proof" titled "Our work" / "Munkáink". Everyone else keeps references on Home. A business of kind "creative" always has this page, however short the brief: its finished work is why people come.
- Two or more locations: give each its own page with role "location" and the same "group" (for example "Locations" / "Helyszínek"), holding a contact block for that location and anything that differs there, such as its timetable. Pages that share a group become one dropdown in the menu. With one location there are no location pages.
- The menu shows at most five entries, and a dropdown counts as one. Do not write nav links: the menu is built from the pages.
- Every page ends with a short "cta" section carrying the site's main action.
- Do not write privacy or company-details pages. They are generated from the business facts.

${RECIPES}
`.trim();
