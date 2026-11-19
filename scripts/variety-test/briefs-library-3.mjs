// The third wave of new business types: one sample business for each type that got a
// recipe in this wave. Run with BRIEFS=./briefs-library-3.mjs.
// All names, addresses and numbers are invented.

export const TYPES = {
  physio: { label: 'Physiotherapist', kind: 'health' },
  psych: { label: 'Psychologist', kind: 'health' },
  trainer: { label: 'Personal trainer', kind: 'health' },
  cafe: { label: 'Café', kind: 'hospitality' },
  bistro: { label: 'Bistro', kind: 'hospitality' },
  pastry: { label: 'Pastry shop', kind: 'hospitality' },
};

export const BRIEFS = [
  {
    id: 'mozdulat-gyogytorna',
    type: 'physio',
    angle: 'Back pain and recovery after surgery',
    brief:
      'Mozdulat Gyógytorna: Fehér Zsófia gyógytornász-fizioterapeuta rendelője Budapesten, a XIII. kerületben (1136 Budapest, Tátra utca 12.). Derék- és nyakfájás, műtét utáni rehabilitáció (térd, váll), sportsérülések, tartásjavítás. Az első alkalom 60 perces állapotfelmérés 16 000 Ft-ért, a további kezelések 50 percesek, 13 000 Ft; ötalkalmas bérlet 60 000 Ft. Beutaló nem kell. Hétfő–péntek 7–19, online időpontfoglalással. Telefon: +36 30 555 1407, e-mail: zsofia@mozdulat.example. Google értékelés: 4,9 (187 értékelés). Hangnem: szakmai, megnyugtató, érthető.',
  },
  {
    id: 'nyugodt-ter',
    type: 'psych',
    angle: 'Clinical psychologist for adults',
    brief:
      'Nyugodt Tér Pszichológiai Rendelő: Dr. Lakatos Eszter klinikai szakpszichológus Budapesten, a II. kerületben (1024 Budapest, Lövőház utca 9.). Felnőttekkel dolgozik: szorongás, kiégés, párkapcsolati nehézségek, gyász. Kognitív viselkedésterápiás szemlélet, 14 év tapasztalat, szerepel a szakmai nyilvántartásban. Egy ülés 50 perc, 22 000 Ft. Az első alkalom ismerkedő beszélgetés. Személyesen és online is. E-mail: eszter@nyugodtter.example, telefon: +36 30 555 8862. Hangnem: nyugodt, elfogadó, nem ígérget.',
  },
  {
    id: 'eroter-edzes',
    type: 'trainer',
    angle: 'One-to-one training in a private gym',
    brief:
      'Erőtér Személyi Edzés: Kovács Bálint személyi edző Debrecenben, saját kis teremben (4025 Debrecen, Széchenyi utca 31.) és online. Fogyás, erőnövelés, sérülés utáni visszatérés, felkészítés futóversenyre. Az első alkalom ingyenes állapotfelmérés. Egy alkalom 9 000 Ft, tízalkalmas bérlet 80 000 Ft, havi online edzésterv 25 000 Ft. Hétfő–szombat 6–20. Telefon: +36 70 555 3391. Google értékelés: 5,0 (112 értékelés). Hangnem: motiváló, egyenes, nem kiabál.',
  },
  {
    id: 'porkolo-kavezo',
    type: 'cafe',
    angle: 'Specialty coffee, laptop friendly',
    brief:
      'Pörkölő Kávézó: specialty kávézó Pécsen (7621 Pécs, Ferencesek utcája 22.). Saját pörkölésű kávé, filter és eszpresszó, házi sütemények, reggeli 11 óráig. Laptoppal is lehet dolgozni, kutyabarát hely. Hétfő–péntek 7:30–18, szombat–vasárnap 9–17. Telefon: +36 72 555 640. Google értékelés: 4,8 (640 értékelés). Hangulat: laza, világos, a környék nappalija.',
  },
  {
    id: 'kanal-bisztro',
    type: 'bistro',
    angle: 'Modern Hungarian, weekly lunch menu',
    brief:
      'Kanál Bisztró: modern magyar konyha Szegeden (6720 Szeged, Oskola utca 16.). Heti menü hétköznap 11:30 és 15 óra között, 3 490 Ft. A séf Varga Péter, szezonális alapanyagokkal dolgozik, helyi termelőktől. Asztalfoglalás telefonon és online. Kedd–szombat 11:30–22, vasárnap 11:30–16, hétfőn zárva. Telefon: +36 62 555 276, e-mail: asztal@kanalbisztro.example. Google értékelés: 4,7 (890 értékelés). Hangulat: meleg, igényes, nem flancos.',
  },
  {
    id: 'habcsok-cukraszda',
    type: 'pastry',
    angle: 'Family pastry shop, cakes to order',
    brief:
      'Habcsók Cukrászda: családi cukrászda Egerben 1994 óta (3300 Eger, Széchenyi utca 8.). Házi sütemények, torták rendelésre legalább három nappal előre, glutén- és cukormentes sütemények, nyáron kézműves fagylalt. Egy szelet 890 és 1 290 Ft között. Minden nap 9–19. Telefon: +36 36 555 194. Google értékelés: 4,9 (512 értékelés). Hangulat: nosztalgikus, kedves, családi.',
  },
];
