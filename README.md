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

Six finished sites ship with the repository, pictures included. "New site" lists them all. The five generated ones are exactly as Claude Sonnet 5.5 wrote them, with pictures by Gemini 3.1 Flash Lite Image.

| Site | Kind | What it shows |
| - | - | - |
| Scorch Bros (the starter) | Hot sauce brand, English | A one-page site, generated in 22 seconds |
| Csendes Tér | Yoga studio, Hungarian | Seven pages, two studios under a dropdown, a timetable, coaches |
| Fészek Stúdió | Interior design, Hungarian | Five pages, the giant-heading hero (chosen by the model), an "Our work" gallery |
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

Every business gets all the pages of its kind, however short its brief: the owner is not a web expert, so the site is given complete and corrected afterwards. Adjustments the model is told to make: give a long price list or a team of three or more its own page; add an "Our work" page where finished work is the product (home design, landscaping, tiling, photography); keep the menu to five entries.

One part of the rule is enforced in code, not left to the model: a business with two or more locations always gets a page per location, grouped under one dropdown (`ensureLocations` in `src/site/ops.ts`). In both test runs the model left those pages out and the rule added them.

The new blocks are general on purpose. A **row** is a name, a detail and a value on the right, so it is a price, a menu item, a class in a timetable. Rows that share a group are drawn together under its heading. That is why there is no timetable component and no menu component.

**Language.** A site is written in the language of its brief. The few words the renderer writes itself (form labels, "Opening hours", the legal pages) exist in English and Hungarian (`src/site/strings.ts`). All 21 fonts cover ő and ű. Headings shrink until their longest word fits, because a Hungarian headline often has one very long word.

## Recipes for business types

The page rule works at the level of eight kinds of business. A recipe (`src/site/recipes.ts`) goes one level finer: half a page of plain guidance for one type of business, saying what its visitors come for, what Home holds and what its pictures should show. Supporting another type means writing a recipe, and building a new piece only when at least two types need it.

| Has a recipe | Sample sites generated |
| - | - |
| Hairdresser, electrician, yoga studio | Yes, in the three variety rounds |
| Beautician, nail studio, masseur, photographer, wedding services, interior designer | Yes, eleven sites (`scripts/variety-test/briefs-library-1.mjs`) |
| Air-conditioning installer, tiler, accountant, cleaning company, landscaper, HR consultant, financial adviser, language teacher | Yes, eight sites (`scripts/variety-test/briefs-library-2.mjs`) |
| Health and movement, hospitality | Page rule only, never generated |

Two blocks exist for businesses whose finished work is what they sell: **before and after** (two pictures of the same thing side by side) and **project** (one piece of work with its own pictures, a title and a line of text). With generated pictures the two halves of a before-and-after never show the same subject, and a portfolio shows only that the layout works; both need the owner's own photos.

A recipe says what a site should hold, not the order. What Home leads with is drawn per site and can be moved afterwards.

## Hero styles

The first screen can be composed five ways. Every style arranges the same things a hero already has (heading, eyebrow, body, buttons, picture, blocks), so switching never loses content and needs no new content.

| Style | What it does | Needs |
| - | - | - |
| standard | Follows the section's layout: a split with a picture, a centred stack, or a full photo behind the text | Nothing |
| overlap | A very large heading runs the full width and crosses the top of a tall picture | A picture |
| wordmark | The heading as one giant word, the picture in the middle of it, notes either side, the buttons as a bar of links | A picture and a heading of one or two words |
| ticker | A full photo, a short statement, and the heading as one giant moving line | A heading |
| edge | Copy on one side, a picture that runs to the edge of the screen on the other | A picture |

If a style's needs are not met, the planner draws the nearest one that works and the inspector says why (a wordmark with a long heading is drawn as overlap). Select a hero and use "Hero style" in the Sections tab to try them.

## What the code decides for a new site

Left to itself the AI converges. In a test of twenty sites it used two of the five hero styles, one order of sections and less than one divider per site, because each choice looked reasonable taken alone. So these choices are drawn by code from the brief and handed to the AI as decisions (`src/site/direction.ts`):

| Choice | Options |
| - | - |
| First screen | Three of eight compositions are offered and the AI picks one: picture to the right or left edge, giant heading over a picture, the name as a giant word, a full photo with a moving line, a full photo with centred text, a shaped picture beside the copy, centred text over a wide picture |
| What Home leads with | The offer, the people, proof, or how it works |
| How Home ends | A call-to-action band, a contact section, or a call to action beside a picture |
| Where dividers go | Nowhere, around dark and accent sections, or at every change of colour |
| Arrangements | One each for calls to action, page titles, rows of cards and reviews (see below), the same across the whole site |

The draw depends only on the brief, so the same brief always gets the same shape. The AI still writes everything and still chooses the look. After it finishes, the first screen, the divider rule and the arrangements are checked and corrected in code, the same way location pages are. In the tests the AI had already followed them on nearly every site.

Dividers are no longer asked for section by section. A section's "edge below" is Automatic by default and follows "Divider placement" in the Theme tab; setting it by hand makes that one boundary an exception.

## Arrangements

Four kinds of section looked the same on every site however the rest was steered, so each has four arrangements. Like a hero style, an arrangement only rearranges what the section already holds, and one that lacks what it needs (a picture, a review score) is drawn as the plain one. Each such section has an "Arrangement" control in the Sections tab.

| Section | Arrangements |
| - | - |
| Call to action | Centred band · with phone and opening hours beside it · large statement with the buttons beside it · beside a picture |
| Title of an inner page | Title and one sentence · on a picture · with key facts beside it · with links to the sections below |
| Row of cards | Row of cards · numbered list with rules · picture and text rows · one large card with the rest beside it |
| Reviews | Row of review cards · one large review · the score beside the reviews · staggered wall |

## The variety test

`scripts/variety-test` generates twenty sites from twenty briefs (five hairdressers, five electricians, five yoga studios, five interior designers), photographs every page and measures how alike the sites are. Run it again after any change that is meant to make sites differ. With the app running:

```bash
node --import ./scripts/variety-test/hooks.mjs scripts/variety-test/generate.mjs round-4   # about 3 minutes, about $1
node scripts/variety-test/shots.mjs round-4                                                # generates the pictures, about $5
node --import ./scripts/variety-test/hooks.mjs scripts/variety-test/analyze.mjs round-4
node scripts/variety-test/compare.mjs variety-3 round-4
python3 scripts/variety-test/sheets.py round-4                                             # contact sheets, needs Pillow
```

Results land in `.prototype-cache/runs/<name>` and any site can be opened by itself at `/preview/<name>/<site>`. Restart the dev server after changing the AI's instructions; it can keep serving the old ones.

| Measure | Round one | Round two (choices drawn by code) | Round three (arrangements) |
| - | - | - | - |
| First-screen compositions in use | 2 | 8 | 6 |
| Sites with text on the left and a picture on the right | 20 of 20 | 10 of 20 | 15 of 20 |
| Calls to action drawn as the plain centred band | 69 of 69 | 66 of 66 | 25 of 76 |
| Inner-page titles drawn as a plain title | 58 of 58 | 57 of 57 | 9 of 57 |
| Card sections drawn as a plain row of cards | 20 of 20 | 18 of 18 | 5 of 20 |
| Review sections drawn as a plain row of cards | 18 of 18 | 16 of 16 | 5 of 20 |
| Inner pages with no picture | 45 of 60 | 46 of 60 | 24 of 59 |
| Dividers drawn across all pages | 15 | 120 | 41 |
| Section order shared by two sites of the same type | 71% | 56% | 70% |
| Operations rejected | 0 of 475 | 0 of 470 | 0 of 465 |

Round two changed no components: the code started drawing the first screen, the order and ending of Home and the divider rule. Round three added the arrangements.

Two things in round three need reading with care. Offering three first screens and letting the AI pick brought its favourites back: it never chose the full photo in twelve offers. And the draw was fixed in that round so that a site's choices no longer arrive as a package, which reshuffled every brief's draws: twelve of the twenty briefs happened to draw "no dividers" and none drew the contact ending, so dividers and shared order moved for reasons of luck. Over 10,000 draws each option comes up as often as it should.

## Things to try

- **Theme tab**: click the four presets, then Shuffle. The same document becomes a different site.
- Click a section, then change its layout, tone and "edge below" in the **Sections** tab.
- **Theme tab**, "Divider placement": dividers nowhere, around dark and accent sections, or wherever the colour changes.
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
| Interior design studio | 5 | 29 applied, 0 rejected | 2.3s | 36.6s |

The interior design run came after the hero styles were added: the model chose the overlap style unprompted and added the "Munkáink" (Our work) page.

Each came out with the pages the rule gives its kind, in Hungarian, and with the contact details from the brief and nothing invented (the electrician's brief gave no prices, so its price list reads "ajánlat szerint", by quote). The 30 pictures generated while building these cost $1.01 in total, about $0.034 each.

Each image's cost, as reported by OpenRouter, is saved beside it in `.prototype-cache/images/<hash>.json` (`costUsd`) for images generated from now on.

That is one run per path, so treat the timings as a first data point. The run also showed the model ignoring one design rule (two neighbouring sections shared a layout twice); the prompt was tightened afterwards and has not been re-run.

## Not done yet

- **Forms are not connected.** Submitting shows a note and sends nothing.
- **Pictures are all generated.** For a real business that is wrong for anything that claims to show the actual premises, people or work; uploading real photos is the missing piece.
- **Legal pages are placeholders.** The privacy notice and company details are template text filled in from the business facts, and need a lawyer's version.
- **Kinds of business without a tested recipe.** Seventeen types have a recipe and sample sites (see above). Health and movement and hospitality have only the page rule. A recipe's before-and-after pairs are followed about two times in three.
- **The draw ignores the mood of the business.** A quiet neighbourhood salon can draw the loudest first screen. Weighting the draw by kind or mood is the obvious next step.
- Custom code blocks (the plan is a `custom` block rendered in a sandboxed frame that receives the theme tokens), saving, publishing, drag and drop.
