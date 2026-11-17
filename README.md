# Site builder prototype

**PROTOTYPE. Throwaway code that answers one question.** Nothing here is production quality: no tests, no real persistence (the current site is kept in the tab's session storage so a reload does not lose a paid generation), minimal error handling.

It needs Node 20 or newer and an [OpenRouter](https://openrouter.ai) key for the AI features. Everything else works without one.

## The question

Can a website builder where the AI never writes code (it only edits a JSON document that a fixed renderer draws) produce sites that

1. appear quickly,
2. cannot be broken by editing, by hand or by AI,
3. still feel free to edit, and
4. look like designed, cohesive sites and not stacked template blocks?

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3210. It opens on **Scorch Bros**, a site the AI generated from a three-sentence brief, complete with its pictures. No key is needed to see it or to edit it by hand.

Without a key the app is in demo mode: "New site" replays the bundled coffee site through the real streaming pipeline, AI edits are disabled, and any picture that is not part of a bundled example stays a placeholder.

To use real models, copy `.env.local.example` to `.env.local`, add your OpenRouter key and restart. Defaults: Claude Sonnet 5.5 builds a site, Claude Haiku 5.5 handles edits, `google/gemini-3.1-flash-lite-image` makes the pictures. All three can be overridden in `.env.local`; the text model can also be switched in the top bar.

Every distinct image prompt is one paid call to the image model. Results are cached in `.prototype-cache/images` (safe to delete), so a prompt is only paid for once. The bundled examples never trigger a call: their pictures ship in `public/starter`.

## Bundled examples

Five finished sites ship with the repository, pictures included. "New site" lists them all. The four generated ones are exactly as Claude Sonnet 5.5 wrote them, with pictures by Gemini 3.1 Flash Lite Image.

| Site | Kind | What it shows |
| - | - | - |
| Scorch Bros (the starter) | Hot sauce brand, English | A one-page site, generated in 22 seconds |
| Csendes Tér | Yoga studio, Hungarian | Seven pages, two studios under a dropdown, a timetable, coaches |
| Hajlak Szalon | Hairdresser, Hungarian | Three pages, a grouped price list, contact and booking |
| Kovács Villany | Electrician, Hungarian | Three pages built around a phone call and a quote request |
| Northfold Coffee | Coffee roaster, English | Written by hand to exercise the whole vocabulary (overlap, photo backdrop, fade) |

The documents are in `src/site/fixtures`.

To ship another generated site as an example:

1. Generate it with a key set, and let its pictures finish.
2. Copy its document from the State drawer into `src/site/fixtures/<name>.json`.
3. Add it to `src/site/fixtures/examples.ts`. The first entry is what a fresh clone opens on.
4. Run `npm run bundle-images`. It copies that site's pictures from the local cache into `public/starter`.

## How it works

```
brief or chat message
        │
        ▼
model writes operations, one JSON object per line      src/ai/prompt.ts
        │  (streamed)
        ▼
each operation is validated and applied, or rejected   src/site/ops.ts, schema.ts
        │
        ▼
one document: theme + nav + sections + footer          (see the State drawer)
        │
        ▼
planner resolves anything that would look broken        src/site/plan.ts
        │
        ▼
renderer draws it                                       src/site/render, site.css
```

- **The document** has a theme, business facts, and pages made of sections made of blocks. *Theme*: a preset plus overrides for palette, fonts, radius, density, scale, and site-wide traits (card style, button style, heading emphasis, divider shape, background pattern, picture shape, eyebrow style). *Sections*: type, tone, edge (how it hands over to the next section), backdrop, layout. *Blocks*: card, stat, quote, image, plan, qa, step, logo, row, person, contact, form, rating, check.
- **Business facts** (phone, email, locations with opening hours, review score, areas served, company details) are stored once. The contact block, the footer, the review score and the legal pages all read from them, so a phone number is typed in one place.
- **Pages.** The menu and the footer links are derived from the pages, so they cannot point at a page that does not exist. Pages that share a group become one dropdown. A privacy notice and a company-details page are generated from the business facts for every site.
- **Layouts** are primitives, not templates: stack, split, grid, bento, marquee. Any block list can go in any of them. Switching grid to bento is one field.
- **Operations** are the only way the document changes. The AI, the inspector and typing on the canvas all go through `applyOp`. An operation produces a valid document or is rejected and changes nothing.
- **Guardrails** are in three places. The schema drops or defaults anything it does not recognise. The theme resolver fixes colour contrast on every tone. The planner swaps an impossible request for the nearest thing that works (a bento of two blocks becomes a grid) without changing the document.
- **Cohesion** comes from making look decisions once, in the theme. A section says "divider below"; the theme decides whether that is a curve, a zigzag or a hairline. Image prompts all get the theme's `imageStyle` appended.

The whole vocabulary lives in `src/site/vocab.ts`. The schema, the inspector and the AI prompt are generated from it.

`src/site` has no dependency on Next.js or the editor, so the schema, operations and renderer can be lifted into another React app.

## Pages and kinds of business

Every site is built from the same page roles: home, offer, approach, proof, people, contact, location. The kind of business decides which roles get a page of their own and which stay a section on Home. That rule is data in `src/site/recipes.ts`; supporting another kind of business means adding an entry there, not building components.

| Kind | Own pages besides Home | Stays on Home |
| - | - | - |
| Beauty and wellness | Services and prices, Contact and booking | Gallery, team, reviews |
| Health practitioner | Services and prices, About and method, Contact and booking | Reviews |
| Studio (yoga, pilates, gym) | Classes and timetable, Our coaches, Methodology, Contact and booking | Reviews |
| Consultant, coach or teacher | Services, About and method, Contact | References |
| Trades | Services, Contact and quote | References, about |
| Café, bistro or pastry shop | Menu, Find us | Gallery, story |
| Creative and events | Portfolio, Packages, About, Contact | Reviews |
| Local business services | Services, About, Contact and quote | References |

Adjustments the model is told to make: fold a page with too little to say back into Home; give a long price list or a team of three or more its own page; add an "Our work" page where finished work is the product (home design, landscaping, tiling, photography); keep the menu to five entries.

One part of the rule is enforced in code, not left to the model: a business with two or more locations always gets a page per location, grouped under one dropdown (`ensureLocations` in `src/site/ops.ts`). In both test runs the model left those pages out and the rule added them.

The new blocks are general on purpose. A **row** is a name, a detail and a value on the right, so it is a price, a menu item, a class in a timetable. Rows that share a group are drawn together under its heading. That is why there is no timetable component and no menu component.

**Language.** A site is written in the language of its brief. The few words the renderer writes itself (form labels, "Opening hours", the legal pages) exist in English and Hungarian (`src/site/strings.ts`). All 21 fonts cover ő and ű. Headings shrink until their longest word fits, because a Hungarian headline often has one very long word.

## Things to try

- **Theme tab**: click the four presets, then Shuffle. The same document becomes a different site.
- Click a section, then change its layout, tone and "edge below" in the **Sections** tab.
- Click any text on the page and type. Mark words with `*asterisks*` in a heading to emphasise them.
- **State** (top bar): the live document, a log of every operation with applied or rejected, and a Load tab. Paste malformed JSON into Load to see what the validator does with it.
- The device buttons lay the page out at a true desktop, tablet or phone width.
- The bar above the page switches between pages. The **Business** tab holds the facts every page shares; change the phone number there and it changes everywhere.
- Open the yoga studio example and use its menu: the two studios sit under one dropdown, and on a phone the menu becomes a list.

## What has and has not been checked

Checked in the browser: all four presets, desktop, tablet and phone widths, selecting, relayout, inline text edits, undo and redo, demo-mode streaming, and loading a deliberately malformed document.

Checked on a fresh clone from GitHub with no key and no image cache: it opens on Scorch Bros with its three pictures, and the Northfold example loads with its four.

Checked against a local mock of OpenRouter (same wire format, deliberately messy output): streamed generation, chat edits on a selected section, rejection of bad operations, image generation and caching.

Checked with a real key (one run each, 17 Nov 2026, hot sauce brief):

| What | Model | Result |
| - | - | - |
| Build a site | Claude Sonnet 5.5 | 8 sections, 12 operations applied, none rejected. First change on screen after 1.3s, finished in 22.3s. |
| Edit a selected section | Claude Haiku 5.5 | "Make this a marquee on a dark background and add two reviews": 3 operations applied, first change after 1.0s, finished in 1.8s. |
| Pictures | `google/gemini-3.1-flash-lite-image` | 7 images across two sites, consistent within each site. |

Multi-page sites for the three test businesses (one run each, 17 Nov 2026, Hungarian briefs, Claude Sonnet 5.5):

| Business | Pages | Operations | First change | Finished |
| - | - | - | - | - |
| Hairdresser | 3 | 20 applied, 0 rejected | 1.9s | 28.6s |
| Electrician | 3 | 23 applied, 0 rejected | 1.9s | 31.8s |
| Yoga studio, two locations | 7 | 28 applied, 0 rejected | 1.6s | 30.4s |

Each came out with the pages the rule gives its kind, in Hungarian, and with the contact details from the brief and nothing invented (the electrician's brief gave no prices, so its price list reads "ajánlat szerint", by quote). The 30 pictures generated while building these cost $1.01 in total, about $0.034 each.

Each image's cost, as reported by OpenRouter, is saved beside it in `.prototype-cache/images/<hash>.json` (`costUsd`) for images generated from now on.

That is one run per path, so treat the timings as a first data point. The run also showed the model ignoring one design rule (two neighbouring sections shared a layout twice); the prompt was tightened afterwards and has not been re-run.

## Not done yet

- **Forms are not connected.** Submitting shows a note and sends nothing.
- **Pictures are all generated.** For a real business that is wrong for anything that claims to show the actual premises, people or work; uploading real photos is the missing piece.
- **Legal pages are placeholders.** The privacy notice and company details are template text filled in from the business facts, and need a lawyer's version.
- **Kinds of business without a tested recipe.** The page rule covers eight kinds, but only hairdresser, electrician and yoga studio have been generated and checked.
- Custom code blocks (the plan is a `custom` block rendered in a sandboxed frame that receives the theme tokens), saving, publishing, drag and drop.
