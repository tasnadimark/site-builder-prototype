// The second wave of new business types: one sample business for each type that got a
// recipe in this wave. Run with BRIEFS=./briefs-library-2.mjs.
// All names, addresses and numbers are invented.

export const TYPES = {
  aircon: { label: 'Air-conditioning installer', kind: 'trades' },
  tiler: { label: 'Tiler', kind: 'trades' },
  accountant: { label: 'Accountant', kind: 'b2b' },
  cleaning: { label: 'Cleaning company', kind: 'b2b' },
  landscaper: { label: 'Landscaper', kind: 'b2b' },
  hr: { label: 'HR consultant', kind: 'consultant' },
  finance: { label: 'Financial adviser', kind: 'consultant' },
  teacher: { label: 'Language teacher', kind: 'consultant' },
};

export const BRIEFS = [
  {
    id: 'husfok-klima',
    type: 'aircon',
    angle: 'Installation in a day, service afterwards',
    brief:
      'Hűsfok Klíma: klímaszerelés Budapesten és Pest megyében. Split klímák telepítése egy nap alatt, tisztítás és karbantartás, javítás, hűtő-fűtő klímák hőszivattyús fűtéshez. Három szerelőpáros, mind F-gáz képesítéssel. Telepítve 3,5 kW-os klíma 289 000 Ft-tól, tisztítás 18 000 Ft, 3 év garancia a szerelésre. Ingyenes helyszíni felmérés, írásos árajánlat. Hétfő–szombat 7–18. Telefon: +36 20 555 4470, e-mail: info@husfok.example. Google értékelés: 4,8 (263 értékelés). Hangnem: gyors, pontos, sallangmentes.',
  },
  {
    id: 'fuga-burkolas',
    type: 'tiler',
    angle: 'Master tiler, bathrooms',
    brief:
      'Fuga Burkolás: Szabó Tamás burkoló mester Székesfehérváron és 40 km-es körzetében, húsz éve. Fürdőszobák, konyhák, padlók és teraszok burkolása, nagyformátumú lapok, vízszigetelés, épített zuhany. Évente negyven fürdőszoba. Burkolás 6 500 Ft/m²-től, előjegyzés 6–8 hét. Ingyenes felmérés, írásos árajánlat, számla. Telefon: +36 30 555 6128. Google értékelés: 4,9 (71 értékelés). Hangnem: precíz, csendes, a munka beszél.',
  },
  {
    id: 'tiszta-konyv',
    type: 'accountant',
    angle: 'Bookkeeping for small businesses',
    brief:
      'Tiszta Könyv Könyvelőiroda: könyvelés egyéni vállalkozóknak és kisebb cégeknek Debrecenben (4026 Debrecen, Bethlen utca 10.). Könyvelés, bérszámfejtés, adótanácsadás, cégalapítási segítség, online számlázóprogramok összekötése. Öt fős iroda, regisztrált mérlegképes könyvelők, vezetője Balogh Erika. Egyéni vállalkozó 15 000 Ft/hó-tól, Kft. 35 000 Ft/hó-tól. Minden kérdésre egy munkanapon belül válaszolnak. Hétfő–péntek 8–16. Telefon: +36 52 555 290, e-mail: iroda@tisztakonyv.example. Google értékelés: 4,9 (54 értékelés). Hangnem: érthető, megbízható, nem beszél szakzsargonban.',
  },
  {
    id: 'ragyog-takaritas',
    type: 'cleaning',
    angle: 'Offices and stairwells',
    brief:
      'Ragyog Takarítás Kft.: irodák és társasházi lépcsőházak rendszeres takarítása Budapesten, felújítás utáni nagytakarítás, ablaktisztítás. Harmincfős csapat, felelősségbiztosítás, minden munkatárs erkölcsi bizonyítvánnyal. Jelenleg 12 irodaházban és 40 társasházban dolgoznak. Betegség esetén helyettest küldenek, saját gépekkel és szerekkel. Árajánlat 24 órán belül, helyszíni felmérés után. Telefon: +36 1 555 0733, e-mail: ajanlat@ragyog.example. Google értékelés: 4,7 (118 értékelés). Hangnem: rendezett, megbízható, üzleti.',
  },
  {
    id: 'zoldag-kertepites',
    type: 'landscaper',
    angle: 'Garden design and building',
    brief:
      'Zöldág Kertépítés: kerttervezés és kertépítés Pest megyében (2100 Gödöllő, Dózsa György út 18.). Kertterv, növénytelepítés, automata öntözőrendszer, gyepszőnyeg, térkő és támfal, majd kertfenntartás szerződéssel. Nyolcfős csapat, vezetője Kiss Dániel kertészmérnök. Eddig 120 megépített kert. Ingyenes helyszíni felmérés. Márciustól novemberig dolgoznak. Telefon: +36 28 555 164, e-mail: kert@zoldag.example. Google értékelés: 4,9 (83 értékelés). Hangnem: természetközeli, nyugodt, szakértő.',
  },
  {
    id: 'emberkozpont-hr',
    type: 'hr',
    angle: 'HR for companies of 20 to 200',
    brief:
      'Emberközpont HR Tanácsadás: Molnár Judit HR tanácsadó, 18 év tapasztalattal, ebből tíz év HR vezetőként. 20–200 fős cégeknek segít: toborzási folyamat, megtartás és fluktuáció, teljesítményértékelés, munkajogi megfelelés, vezetőfejlesztés. Projektalapon vagy havi keretben, interim HR vezetőként is. Az első 45 perces konzultáció ingyenes. Budapesten személyesen, az országban online. E-mail: judit@emberkozpont.example, telefon: +36 30 555 3905. Hangnem: gyakorlatias, egyenes, emberi.',
  },
  {
    id: 'biztos-alap',
    type: 'finance',
    angle: 'Independent adviser for families',
    brief:
      'Biztos Alap Pénzügyi Tanácsadás: Kelemen Ádám független pénzügyi tanácsadó Győrben, az MNB nyilvántartásában szerepel. Családoknak és vállalkozóknak: megtakarítás, lakáshitel, nyugdíjcélú megtakarítás, biztosítások átnézése. Az első beszélgetés ingyenes, a személyre szabott pénzügyi terv 60 000 Ft. Személyesen Győrben (9021 Győr, Kazinczy utca 7.) vagy online. Telefon: +36 96 555 418, e-mail: adam@biztosalap.example. Google értékelés: 5,0 (39 értékelés). Hangnem: nyugodt, érthető, nem nyomul.',
  },
  {
    id: 'angol-kataval',
    type: 'teacher',
    angle: 'English for adults, exam preparation',
    brief:
      'Angol Katával: Tóth Kata angoltanár Szegeden és online, felnőtteknek. Újrakezdők, nyelvvizsga-felkészítés (B2, C1), üzleti angol. Egyéni óra 8 000 Ft / 60 perc, tízalkalmas bérlet 72 000 Ft, kiscsoportos óra 4 500 Ft. A próbaóra ingyenes. Tizenkét éve tanít, 300 tanítvány, a vizsgázók 92 százaléka elsőre átment. E-mail: kata@angolkataval.example, telefon: +36 70 555 2836. Google értékelés: 5,0 (67 értékelés). Hangnem: bátorító, laza, humoros.',
  },
];
