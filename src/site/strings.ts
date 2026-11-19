// The few words the renderer writes itself (form labels, "Opening hours", legal page
// templates). Everything else on a site is copy from the document.

import type { Business } from './schema';
import type { FormField, Language } from './vocab';

export type Strings = {
  mostPopular: string;
  before: string;
  after: string;
  home: string;
  locations: string;
  address: string;
  phone: string;
  email: string;
  hours: string;
  directions: string;
  send: string;
  sent: string;
  reviews: string;
  menu: string;
  pages: string;
  contact: string;
  areas: string;
  privacy: string;
  imprint: string;
  book: string;
  field: Record<FormField, string>;
  legalNotice: string;
};

export const STRINGS: Record<Language, Strings> = {
  en: {
    mostPopular: 'Most popular',
    before: 'Before',
    after: 'After',
    home: 'Home',
    locations: 'Locations',
    address: 'Address',
    phone: 'Phone',
    email: 'Email',
    hours: 'Opening hours',
    directions: 'Get directions',
    send: 'Send',
    sent: 'Thank you. This form is not connected yet, so nothing was sent.',
    reviews: 'reviews',
    menu: 'Menu',
    pages: 'Pages',
    contact: 'Contact',
    areas: 'Areas we cover',
    privacy: 'Privacy notice',
    imprint: 'Company details',
    book: 'Book online',
    field: { name: 'Name', email: 'Email', phone: 'Phone', service: 'Service', date: 'Preferred date', message: 'Message' },
    legalNotice: 'Template text. Have it checked by a lawyer before publishing.',
  },
  hu: {
    mostPopular: 'Legnépszerűbb',
    before: 'Előtte',
    after: 'Utána',
    home: 'Főoldal',
    locations: 'Helyszínek',
    address: 'Cím',
    phone: 'Telefon',
    email: 'E-mail',
    hours: 'Nyitvatartás',
    directions: 'Útvonaltervezés',
    send: 'Küldés',
    sent: 'Köszönjük! Az űrlap még nincs bekötve, ezért az üzenet nem lett elküldve.',
    reviews: 'értékelés',
    menu: 'Menü',
    pages: 'Oldalak',
    contact: 'Kapcsolat',
    areas: 'Kiszállási területek',
    privacy: 'Adatkezelési tájékoztató',
    imprint: 'Impresszum',
    book: 'Online foglalás',
    field: { name: 'Név', email: 'E-mail', phone: 'Telefon', service: 'Szolgáltatás', date: 'Kívánt időpont', message: 'Üzenet' },
    legalNotice: 'Sablonszöveg. Közzététel előtt jogi ellenőrzés szükséges.',
  },
};

type LegalDoc = { title: string; parts: { heading: string; lines: string[] }[] };

const or = (v: string | undefined, fallback: string) => (v && v.trim() ? v : fallback);

/**
 * The two pages every site carries. They are filled in from the business facts so they
 * can never disagree with the contact page. The wording is a placeholder, not legal advice.
 */
export function legalPage(which: 'privacy' | 'imprint', lang: Language, name: string, b: Business): LegalDoc {
  const loc = b.locations[0];
  const company = or(b.company, name);
  const address = or(loc?.address, lang === 'hu' ? '[székhely címe]' : '[registered address]');
  const email = or(b.email, lang === 'hu' ? '[e-mail-cím]' : '[email address]');
  const phone = or(b.phone ?? loc?.phone, lang === 'hu' ? '[telefonszám]' : '[phone number]');

  if (which === 'imprint') {
    return lang === 'hu'
      ? {
          title: 'Impresszum',
          parts: [
            {
              heading: 'A szolgáltató adatai',
              lines: [
                `Név: ${company}`,
                `Székhely: ${address}`,
                `Adószám: ${or(b.taxId, '[adószám]')}`,
                `Nyilvántartási szám: ${or(b.registration, '[cégjegyzékszám vagy nyilvántartási szám]')}`,
              ],
            },
            { heading: 'Elérhetőség', lines: [`Telefon: ${phone}`, `E-mail: ${email}`] },
            { heading: 'Tárhelyszolgáltató', lines: ['[tárhelyszolgáltató neve, címe és elérhetősége]'] },
          ],
        }
      : {
          title: 'Company details',
          parts: [
            {
              heading: 'Service provider',
              lines: [
                `Name: ${company}`,
                `Registered address: ${address}`,
                `Tax number: ${or(b.taxId, '[tax number]')}`,
                `Registration number: ${or(b.registration, '[company or register number]')}`,
              ],
            },
            { heading: 'Contact', lines: [`Phone: ${phone}`, `Email: ${email}`] },
            { heading: 'Hosting provider', lines: ['[name, address and contact details of the hosting provider]'] },
          ],
        };
  }

  return lang === 'hu'
    ? {
        title: 'Adatkezelési tájékoztató',
        parts: [
          { heading: 'Az adatkezelő', lines: [`${company}, ${address}`, `E-mail: ${email}`] },
          {
            heading: 'Milyen adatokat kezelünk',
            lines: ['A kapcsolatfelvételi űrlapon megadott nevet, e-mail-címet, telefonszámot és az üzenet tartalmát.'],
          },
          {
            heading: 'Az adatkezelés célja és jogalapja',
            lines: ['Az adatokat kizárólag a megkeresés megválaszolására és az időpont egyeztetésére használjuk. Az adatkezelés jogalapja az Ön hozzájárulása.'],
          },
          { heading: 'Meddig őrizzük meg az adatokat', lines: ['A megkeresés lezárását követően legfeljebb [időtartam] ideig.'] },
          {
            heading: 'Az Ön jogai',
            lines: ['Kérheti az adataihoz való hozzáférést, azok helyesbítését vagy törlését, és bármikor visszavonhatja a hozzájárulását.', `Kérését a következő címre küldheti: ${email}`],
          },
        ],
      }
    : {
        title: 'Privacy notice',
        parts: [
          { heading: 'Who is responsible', lines: [`${company}, ${address}`, `Email: ${email}`] },
          { heading: 'What we collect', lines: ['The name, email address, phone number and message you enter in the contact form.'] },
          {
            heading: 'Why, and on what basis',
            lines: ['We use it only to answer your enquiry and arrange an appointment. The legal basis is your consent.'],
          },
          { heading: 'How long we keep it', lines: ['For no longer than [period] after your enquiry is closed.'] },
          {
            heading: 'Your rights',
            lines: ['You can ask to see, correct or delete your data, and withdraw your consent at any time.', `Send requests to: ${email}`],
          },
        ],
      };
}
