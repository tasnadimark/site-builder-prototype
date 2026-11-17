// A hand-written site, stored as the same stream of operations the AI produces
// (northfold.json). Loading it exercises the real pipeline, and it doubles as the
// demo-mode response when no API key is configured.

import ops from './northfold.json';

export const NORTHFOLD_BRIEF =
  'Northfold Coffee Roasters: a small-batch roastery in Leeds that sells single-origin coffee by subscription. Beans are roasted to order and delivered within 48 hours. Buys direct from six partner farms and publishes what it pays. Calm, premium, a little bookish.';

export const NORTHFOLD_OPS: unknown[] = ops;

/** One-click briefs chosen to pull the presets in different directions. */
export const EXAMPLE_BRIEFS: { label: string; brief: string; kind?: string }[] = [
  {
    label: 'Fodrászat',
    kind: 'beauty',
    brief:
      'Hajlak Szalon: női és férfi fodrászat Budapesten, a VII. kerületben (1075 Budapest, Király utca 23.). Három fodrász dolgozik itt: Dóra a festések és a balayage szakértője, Márk a férfi hajvágásoké, Lili az alkalmi frizuráké. Telefon: +36 30 123 4567, e-mail: hello@hajlak.example. Nyitvatartás: kedd–péntek 9–19, szombat 9–14, vasárnap és hétfő zárva. Online időpontfoglalás van. Google értékelés: 4,9 (212 értékelés). Hangulat: barátságos, igényes, nem sznob.',
  },
  {
    label: 'Villanyszerelő',
    kind: 'trades',
    brief:
      'Kovács Villany: Kovács Gábor regisztrált villanyszerelő mester, 14 éve dolgozik Budapesten és Pest megyében (Budaörs, Érd, Törökbálint, XI., XII. és XXII. kerület). Lakások és családi házak villanyszerelése, hibaelhárítás, biztosítéktábla-csere, érintésvédelmi felülvizsgálat, elektromos autó töltő telepítése. Írásos árajánlat 24 órán belül, számlával, garanciával. Telefon: +36 20 987 6543, e-mail: gabor@kovacsvillany.example. Hétfő–péntek 7–18, hibaelhárítás hétvégén is. Google értékelés: 4,8 (96 értékelés). Hangnem: egyenes, megbízható, sallangmentes.',
  },
  {
    label: 'Jógastúdió',
    kind: 'studio',
    brief:
      'Csendes Tér Jógastúdió: két stúdió Budapesten. Budai stúdió: 1114 Budapest, Bartók Béla út 29. Pesti stúdió: 1066 Budapest, Teréz körút 12. Hatha, vinyasa, yin és kismama jóga, kezdőknek és haladóknak, hétköznap reggel és este, hétvégén délelőtt. Négy oktató: Anna (hatha, alapító), Bence (vinyasa), Réka (yin és kismama), Zsófi (kezdő csoportok). Az első óra ingyenes, bérletek 5 és 10 alkalomra, valamint havi korlátlan bérlet. Telefon: +36 70 555 0101, e-mail: szia@csendester.example. Google értékelés: 4,9 (348 értékelés). Hangulat: nyugodt, befogadó, nem ezoterikus.',
  },
  { label: 'Coffee roaster', brief: NORTHFOLD_BRIEF },
  {
    label: 'B2B invoicing tool',
    brief:
      'Ledgerline: invoice automation for finance teams at mid-size companies. Syncs with the ERP, chases late payments automatically, reconciles in real time. SOC 2 certified. Buyers are finance directors who distrust hype.',
  },
  {
    label: "Kids' swim school",
    brief:
      'Splash Academy: swimming lessons for children aged 3 to 10. Groups of four, a warm shallow teaching pool, patient teachers, term-based booking with a free trial lesson. Parents are nervous first-timers.',
  },
  {
    label: 'Hot sauce brand',
    brief:
      'Scorch Bros: small-batch hot sauce made by two brothers in a railway arch. Three heat levels, sold online and at street-food markets. Loud, funny and proud of it.',
  },
];
