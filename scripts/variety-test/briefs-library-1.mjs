// The first wave of new business types: two sample businesses for each type that got a
// recipe in this wave (beautician, nail studio, masseur, photographer, wedding services).
// Run with BRIEFS=./briefs-library-1.mjs. All names, addresses and numbers are invented.

export const TYPES = {
  beautician: { label: 'Beautician', kind: 'beauty' },
  nails: { label: 'Nail studio', kind: 'beauty' },
  massage: { label: 'Masseur', kind: 'beauty' },
  photographer: { label: 'Photographer', kind: 'creative' },
  wedding: { label: 'Wedding service', kind: 'creative' },
  interior: { label: 'Interior designer', kind: 'creative' },
};

export const BRIEFS = [
  {
    id: 'borsziget-kozmetika',
    type: 'beautician',
    angle: 'Problem skin, a master beautician',
    brief:
      'Bőrsziget Kozmetika: kozmetika Győrben (9022 Győr, Árpád út 14.). Arckezelések problémás bőrre (akne, rosacea, pigmentfoltok), hidroabrázió, mikrotűs kezelés, gyantázás, szempilla- és szemöldökfestés. A tulajdonos Farkas Edit kozmetikus mester, 15 éve dolgozik; az első alkalommal ingyenes bőrdiagnosztika. Csak előre foglalt időpontra, online foglalással. Kedd–péntek 9–18, szombat 9–13. Telefon: +36 96 555 310, e-mail: edit@borsziget.example. Google értékelés: 4,9 (176 értékelés). Hangulat: szakmai, megnyugtató, tiszta.',
  },
  {
    id: 'glow-bar',
    type: 'beautician',
    angle: 'Fast treatments, young and trendy',
    brief:
      'Glow Bar Budapest: gyors szépségkezelések a belvárosban (1061 Budapest, Andrássy út 28.). 30–45 perces expressz arckezelések ebédidőben, szemöldöklaminálás, szempillalifting, gyantázás. Három kozmetikus: Dorka, Petra és Vivi. Online időpontfoglalás, de be is lehet ugrani. Hétfő–szombat 8–20. Telefon: +36 30 555 0808. Google értékelés: 4,8 (412 értékelés). Hangulat: fiatalos, trendi, pörgős.',
  },
  {
    id: 'korom-muhely',
    type: 'nails',
    angle: 'Precise, minimal nail art',
    brief:
      'Köröm Műhely: műköröm és géllakk Szegeden (6722 Szeged, Tisza Lajos körút 55.). Dudás Vivien körömépítő egyedül dolgozik, több versenyen díjazott. Minimal és kézzel festett nail art, géllakk 7 500 Ft, építés 12 000 Ft, töltés 9 500 Ft, manikűr 5 000 Ft. Steril eszközök, egyszer használatos reszelők. Kedd–szombat 9–18, csak időpontra. Telefon: +36 70 555 6612. Google értékelés: 5,0 (98 értékelés). Hangulat: letisztult, precíz, pasztell.',
  },
  {
    id: 'lakk-and-roll',
    type: 'nails',
    angle: 'Loud nail bar, walk-ins',
    brief:
      'Lakk & Roll Nail Bar: körömszalon Debrecen belvárosában (4024 Debrecen, Batthyány utca 3.). Négy körmös, extrém nail art, króm, 3D díszítés, géllakk, építés, pedikűr. Bejelentkezés nélkül is fogadnak vendéget. Hétfő–szombat 9–20. Telefon: +36 52 555 441. Google értékelés: 4,7 (305 értékelés). Hangulat: harsány, vagány, színes.',
  },
  {
    id: 'kezmuhely-masszazs',
    type: 'massage',
    angle: 'Remedial and sports massage',
    brief:
      'Kézműhely Masszázs: Varga Balázs gyógymasszőr Budapesten, a XII. kerületben (1126 Budapest, Böszörményi út 20.). Svédmasszázs, sportmasszázs, nyak- és vállkezelés irodai dolgozóknak, triggerpont-terápia. 30, 60 és 90 perces kezelések: 7 000, 12 000 és 17 000 Ft. Öt- és tízalkalmas bérlet, ajándékutalvány. Hétfő–péntek 8–20. Telefon: +36 20 555 9034. Google értékelés: 4,9 (221 értékelés). Hangulat: szakmai, egyenes, sallangmentes.',
  },
  {
    id: 'harmonia-masszazs',
    type: 'massage',
    angle: 'Thin brief: relaxing massage',
    brief: 'Harmónia Masszázs: relaxáló és aromaterápiás masszázs Veszprémben, pároknak is. Ajándékutalvány kapható.',
  },
  {
    id: 'kovats-anna-foto',
    type: 'photographer',
    angle: 'Weddings and families, natural light',
    brief:
      'Kováts Anna Fotó: esküvői és családi fotós, Budapesten és a Balaton-felvidéken dolgozik. Természetes fény, dokumentarista stílus, kevés beállított kép. Csomagok: fél napos esküvő 180 000 Ft (300 kidolgozott kép), egész napos esküvő 290 000 Ft (600 kép), jegyesfotózás 60 000 Ft. A képek négy héten belül elkészülnek, online galériában. Évente legfeljebb 25 esküvőt vállal. E-mail: hello@kovatsanna.example, telefon: +36 30 555 7721. Google értékelés: 5,0 (64 értékelés). Hangulat: meleg, őszinte, filmes.',
  },
  {
    id: 'studio-kontraszt',
    type: 'photographer',
    angle: 'Business portraits and product shots',
    brief:
      'Stúdió Kontraszt: portré- és termékfotó stúdió cégeknek Budapesten (1095 Budapest, Soroksári út 48.). Üzleti portrék, csapatfotók, webáruházi termékfotó, ételfotó. Két fotós: Gergely és Nóri. Óradíjas és napidíjas munkák, 48 órás átadás. Hétfő–péntek 9–18. Telefon: +36 1 555 0456, e-mail: studio@kontraszt.example. Google értékelés: 4,9 (88 értékelés). Hangulat: letisztult, kontrasztos, profi.',
  },
  {
    id: 'igen-eskuvo',
    type: 'wedding',
    angle: 'Full wedding planning',
    brief:
      'Igen! Esküvőszervezés: teljes körű esküvőszervezés Budapesten és a Dunakanyarban. Szabó Lilla és háromfős csapata eddig 120 esküvőt szervezett. Három szint: teljes szervezés, részleges szervezés, koordináció a nagy napon. Helyszínkeresés, szolgáltatók, forgatókönyv, költségvetés. Az első konzultáció ingyenes. E-mail: igen@igeneskuvo.example, telefon: +36 30 555 2244. Google értékelés: 5,0 (47 értékelés). Hangulat: romantikus, de szervezett és megnyugtató.',
  },
  {
    id: 'vadvirag-dekor',
    type: 'wedding',
    angle: 'Rustic decoration and flowers',
    brief:
      'Vadvirág Dekor: esküvői dekoráció és virágkötészet a Balatonnál (8600 Siófok, Fő utca 93.). Boho és rusztikus stílus, mezei és szezonális virágok. Asztaldíszek, ceremóniaív, menyasszonyi csokor, kellékbérlés. Évente negyven esküvő. Telefon: +36 84 555 318, e-mail: hello@vadviragdekor.example. Google értékelés: 4,9 (59 értékelés). Hangulat: természetes, laza, kézműves.',
  },
  {
    id: 'nordhaz-enterior',
    type: 'interior',
    angle: 'Scandinavian, lakeside homes',
    brief:
      'Nordház Enteriőr: lakberendező stúdió Balatonfüreden (8230 Balatonfüred, Blaha Lujza utca 4.). Balatoni nyaralók és családi házak berendezése skandináv és japandi stílusban, természetes anyagokkal: tölgy, len, kő, mészfesték. Két tervező, Lilla és Áron. Helyi asztalosokkal és kárpitosokkal dolgoznak. 35 befejezett otthon a Balaton körül. Hétfő–péntek 9–16. Telefon: +36 87 555 219, e-mail: hello@nordhaz.example. Google értékelés: 5,0 (28 értékelés). Hangulat: világos, levegős, természetes, lassú.',
  },
];
