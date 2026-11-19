// Twenty briefs for the variety test: five businesses of each of the four types that
// have already been generated successfully. Within a type the businesses differ in
// positioning, size and mood, because that is what should make their sites differ.
// The fifth brief of each type is deliberately thin, the way a busy owner might write it.
//
// All names, addresses, phone numbers and ratings are invented.

export const TYPES = {
  hairdresser: { label: 'Hairdresser', kind: 'beauty' },
  electrician: { label: 'Electrician', kind: 'trades' },
  yoga: { label: 'Yoga studio', kind: 'studio' },
  interior: { label: 'Interior designer', kind: 'creative' },
};

export const BRIEFS = [
  // ---------------------------------------------------------------- hairdressers
  {
    id: 'kalvin-barber',
    type: 'hairdresser',
    angle: 'Cheap, walk-in barber shop',
    brief:
      'Kálvin Barber: férfi borbélyműhely Budapesten, a VIII. kerületben (1085 Budapest, Baross utca 8.). Hajvágás, szakállformázás, hagyományos borotválás forró törölközővel. Két borbély: Tomi és Zsolt. Bejelentkezés nélkül is lehet jönni, a hajvágás 20 perc és 4500 Ft. Hétfő–szombat 10–20. Telefon: +36 30 220 1188. Google értékelés: 4,7 (530 értékelés). Hangulat: laza, fiús, kicsit old school, van humora.',
  },
  {
    id: 'maison-lumiere',
    type: 'hairdresser',
    angle: 'Premium colour salon',
    brief:
      'Maison Lumière: prémium fodrászszalon Budapest belvárosában (1052 Budapest, Petőfi Sándor utca 6., első emelet). Színspecialisták: balayage, szőkítés, keratinos hajkezelés, esküvői és alkalmi frizurák. Négy stylist dolgozik itt, Kinga a vezető színspecialista. Csak előre foglalt időpontra, online foglalással. Kedd–szombat 9–20. Telefon: +36 1 555 0142, e-mail: szalon@maisonlumiere.example. Google értékelés: 4,9 (184 értékelés). Hangulat: elegáns, csendes luxus, visszafogott, semmi harsány.',
  },
  {
    id: 'tincs-gyerekfodraszat',
    type: 'hairdresser',
    angle: "Children's hairdresser",
    brief:
      'Tincs Gyerekfodrászat: gyerekekre szakosodott fodrászat Debrecenben (4025 Debrecen, Piac utca 41.). Autós és repülős székek, mese megy hajvágás közben, az első hajvágásról oklevél és egy tincs jár emlékbe. Érzékeny, félős gyerekekkel is türelmesek. Szülőknek is vágnak hajat. Két fodrász: Bori és Enikő. Hétfő–péntek 9–18, szombat 9–13. Telefon: +36 52 555 017, online időpontfoglalás. Google értékelés: 4,9 (267 értékelés). Hangulat: játékos, színes, kedves, megnyugtató a szülőknek.',
  },
  {
    id: 'zold-hajmuhely',
    type: 'hairdresser',
    angle: 'Eco, plant-based salon',
    brief:
      'Zöld Hajműhely: öko fodrászat Szegeden (6720 Szeged, Kárász utca 9.). Csak növényi hajfestékekkel és vegán, illatanyagmentes termékekkel dolgoznak, a levágott hajat komposztálják, a szalon hulladékmentes. Fejbőrdiagnosztika és növényi pakolások. A tulajdonos, Eszter egyedül dolgozik, egyszerre egy vendéggel. Szerda–szombat 10–18, csak időpontra. Telefon: +36 70 314 2260, e-mail: eszter@zoldhajmuhely.example. Hangulat: természetes, nyugodt, tudatos, nem prédikál.',
  },
  {
    id: 'szilvi-fodraszat',
    type: 'hairdresser',
    angle: 'Thin brief: neighbourhood salon',
    brief: 'Szilvi Fodrászat: női, férfi és gyerek hajvágás Kecskeméten, húsz éve. Barátságos, megfizethető.',
  },

  // ---------------------------------------------------------------- electricians
  {
    id: 'gyorsvillany',
    type: 'electrician',
    angle: '24-hour emergency call-out',
    brief:
      'GyorsVillany 0–24: villanyszerelő gyorsszolgálat Budapesten, éjjel-nappal, hétvégén és ünnepnapokon is. Hat szerelő, 60 percen belüli kiszállás a város egész területén. Áramszünet, zárlat, leégett biztosíték, szikrázó konnektor, beázott vezeték. Fix kiszállási díj (12 900 Ft), a munka árát a helyszínen, kezdés előtt mondják meg. Telefon: +36 1 555 0199. Google értékelés: 4,6 (812 értékelés). Hangnem: gyors, határozott, megnyugtató annak, aki bajban van.',
  },
  {
    id: 'napfeny-energia',
    type: 'electrician',
    angle: 'Solar, car chargers, smart home',
    brief:
      'Napfény Energia: villanyszerelő cég Győrben és 50 km-es körzetében (9021 Győr, Baross Gábor út 14.). Napelemes rendszerek, elektromos autó töltők és okosotthon-rendszerek tervezése és telepítése családi házakhoz. Mérnöki felmérés, megtérülési számítás, pályázati ügyintézés, 150 telepített rendszer. Vezetője Horváth Ádám villamosmérnök, négy szerelővel. Hétfő–péntek 8–17. Telefon: +36 96 555 233, e-mail: info@napfenyenergia.example. Google értékelés: 4,9 (73 értékelés). Hangnem: modern, technológiai, számokkal érvel.',
  },
  {
    id: 'toth-es-fia',
    type: 'electrician',
    angle: 'Father-and-son family firm',
    brief:
      'Tóth és Fia Villanyszerelés: családi vállalkozás Pécsen 1989 óta (7621 Pécs, Király utca 30.). Tóth László villanyszerelő mester és fia, Tóth Bence. Régi házak és panellakások teljes áthálózása, alumínium vezetékek cseréje rézre, villanyóra-szabványosítás, hibaelhárítás. Ugyanaz a két ember jön ki felmérni, dolgozni és átadni. Hétfő–péntek 7–17. Telefon: +36 72 555 104. Google értékelés: 5,0 (58 értékelés). Hangnem: hagyományos, családias, szavatartó.',
  },
  {
    id: 'voltex-ipari',
    type: 'electrician',
    angle: 'Commercial and industrial contractor',
    brief:
      'Voltex Ipari Villamosság Kft.: ipari és kereskedelmi villanyszerelés cégeknek, országosan (székhely: 2040 Budaörs, Gyár utca 2.). Irodák, üzletek, raktárcsarnokok és gyártóüzemek erősáramú hálózata, elosztószekrények, világítástervezés, karbantartási szerződések, érintésvédelmi és villámvédelmi felülvizsgálat jegyzőkönyvvel. 12 fős szakembergárda, ISO 9001 tanúsítvány. Hétfő–péntek 7–16, ügyelet a szerződött ügyfeleknek. Telefon: +36 23 555 870, e-mail: ajanlat@voltex.example. Hangnem: szakmai, precíz, cégeknek szól.',
  },
  {
    id: 'nagy-villany',
    type: 'electrician',
    angle: 'Thin brief: one-man electrician',
    brief: 'Nagy Péter villanyszerelő, Miskolc és környéke. Lakásfelújítás, hibaelhárítás, mérőhely-kialakítás. Hívjon bizalommal.',
  },

  // ---------------------------------------------------------------- yoga studios
  {
    id: 'tuz-hot-yoga',
    type: 'yoga',
    angle: 'Hot yoga, athletic',
    brief:
      'TŰZ Hot Yoga: hot yoga és power jóga stúdió Budapesten, a XIII. kerületben (1134 Budapest, Váci út 23.). 38 fokra fűtött terem, 60 és 90 perces dinamikus órák, hajnali 6-tól este 9-ig a hét minden napján. Hat oktató, a vezető oktató Dávid. Zuhanyzók, törölköző- és matracbérlés. Kezdő csomag: 10 nap korlátlan jóga 9900 Ft-ért. Telefon: +36 30 555 0707, e-mail: hello@tuzyoga.example. Google értékelés: 4,8 (421 értékelés). Hangulat: energikus, intenzív, sportos, merész.',
  },
  {
    id: 'fold-es-eg',
    type: 'yoga',
    angle: 'Traditional, two studios',
    brief:
      'Föld és Ég Jógaház: hagyományos jóga két helyszínen. Budai jógaház: 1024 Budapest, Keleti Károly utca 11. Budaörsi jógaház: 2040 Budaörs, Szabadság út 52. Hatha jóga, légzőgyakorlatok (pranajáma), meditáció, évente négy hétvégi elvonulás a Pilisben. Három oktató: Ildikó (alapító, 25 éve tanít), Gergő és Márta. Kis csoportok, legfeljebb 12 fő. Az első óra ingyenes. Telefon: +36 20 555 0312, e-mail: namaste@foldeseg.example. Google értékelés: 4,9 (156 értékelés). Hangulat: elmélyült, meleg, földközeli, de nem giccses.',
  },
  {
    id: 'mini-joga',
    type: 'yoga',
    angle: 'Mums, babies and children',
    brief:
      'Mini Jóga: kismama-, baba-mama és gyerekjóga Székesfehérváron (8000 Székesfehérvár, Fő utca 5.). Kismamajóga a 12. héttől, baba-mama jóga 6 hetes kortól, gyerekjóga 3–6 és 7–10 éveseknek, családi jóga szombat délelőtt. Legfeljebb nyolc fős csoportok, babakocsival megközelíthető, van pelenkázó. Két oktató: Kata (szülésznő és jógaoktató) és Dorka. Hétköznap délelőtt és délután. Telefon: +36 22 555 046. Google értékelés: 5,0 (89 értékelés). Hangulat: játékos, gyengéd, családias.',
  },
  {
    id: 'gerinc-studio',
    type: 'yoga',
    angle: 'Spine therapy, led by a physiotherapist',
    brief:
      'Gerinc Stúdió: gerincjóga és jógaterápia Budapesten, a XI. kerületben (1117 Budapest, Karinthy Frigyes út 18.). Dr. Varga Nóra gyógytornász vezeti, két jógaterapeutával. Hat fős kiscsoportos órák, egyéni állapotfelmérés, személyre szabott gyakorlatsor, ülőmunkát végzőknek és derékfájósoknak. Céges órák irodákban is. Hétfő–csütörtök 7–20, péntek 7–14. Telefon: +36 1 555 0628, e-mail: info@gerincstudio.example. Google értékelés: 4,9 (203 értékelés). Hangulat: szakmai, nyugodt, egészségügyi alapokon áll.',
  },
  {
    id: 'lotusz-joga',
    type: 'yoga',
    angle: 'Thin brief: small-town studio',
    brief: 'Lótusz Jóga: jógaórák Egerben kezdőknek és haladóknak, hétköznap esténként. Az első alkalom ingyenes.',
  },

  // ---------------------------------------------------------------- interior designers
  {
    id: 'atelier-noir',
    type: 'interior',
    angle: 'High-end villas and penthouses',
    brief:
      'Atelier Noir: belsőépítész stúdió Budapesten (1026 Budapest, Pasaréti út 72.). Villák, penthouse lakások és butikhotelek teljes körű belsőépítészete, egyedi bútorokkal és műtárgy-tanácsadással. Két alapító partner, Szalay Réka és Bodor Máté, nyolc fős csapattal; Bécsben és Dubajban is dolgoztak. Évente legfeljebb hat megbízást vállalnak. Hétfő–péntek 10–18, csak előre egyeztetett időpontban. Telefon: +36 1 555 0911, e-mail: studio@ateliernoir.example. Hangulat: sötét, drámai, exkluzív, kevés szóval beszél.',
  },
  {
    id: 'kucko',
    type: 'interior',
    angle: 'Small flats, fixed-price online design',
    brief:
      'Kuckó Lakberendezés: kis lakások (30–60 m²) okos berendezése, online, fix áron, az egész országban. Egy tervező, Panni. Három csomag: egy szoba terve 49 000 Ft, teljes lakás 129 000 Ft, teljes lakás bevásárlólistával és helyszíni bejárással 189 000 Ft. A terv 10 munkanap alatt készül el, IKEA- és JYSK-bútorokkal is dolgozik. Eddig 210 lakás. E-mail: szia@kucko.example, telefon: +36 70 555 4120. Google értékelés: 4,9 (132 értékelés). Hangulat: barátságos, színes, praktikus, nem sznob.',
  },
  {
    id: 'forma-iroda',
    type: 'interior',
    angle: 'Offices, cafés and shops',
    brief:
      'Forma Iroda- és Üzlettervezés: kereskedelmi belsőépítészet Budapesten (1094 Budapest, Tűzoltó utca 59.). Irodák, kávézók, éttermek és üzletek tervezése a koncepciótól a kulcsrakész átadásig, generálkivitelezéssel. Öt fős csapat, vezető tervező: Fekete Gábor. 40 átadott projekt, köztük 12 iroda és 9 kávézó. Hétfő–péntek 9–18. Telefon: +36 1 555 0377, e-mail: projekt@formairoda.example. Google értékelés: 4,8 (37 értékelés). Hangulat: határozott, modern, üzleti, határidőre dolgozik.',
  },
  {
    id: 'nordhaz',
    type: 'interior',
    angle: 'Scandinavian, lakeside homes',
    brief:
      'Nordház Enteriőr: lakberendező stúdió Balatonfüreden (8230 Balatonfüred, Blaha Lujza utca 4.). Balatoni nyaralók és családi házak berendezése skandináv és japandi stílusban, természetes anyagokkal: tölgy, len, kő, mészfesték. Két tervező, Lilla és Áron. Helyi asztalosokkal és kárpitosokkal dolgoznak. 35 befejezett otthon a Balaton körül. Hétfő–péntek 9–16. Telefon: +36 87 555 219, e-mail: hello@nordhaz.example. Google értékelés: 5,0 (28 értékelés). Hangulat: világos, levegős, természetes, lassú.',
  },
  {
    id: 'vera-enterior',
    type: 'interior',
    angle: 'Thin brief: home staging',
    brief: 'Vera Enteriőr: lakberendezés és home staging Sopronban. Eladó és kiadó lakások felkészítése, teljes lakberendezés. Kérjen ajánlatot.',
  },
];
