// Complete, hand-tuned themes. "Shuffle" applies one of these as a single theme
// operation, which is the whole mechanism behind changing a site's look and feel.

export const LOOKS: { name: string; theme: object }[] = [
  {
    name: 'Oat and terracotta',
    theme: { preset: 'editorial', palette: { bg: '#f4efe6', surface: '#eae2d2', ink: '#1c1915', accent: '#b4532a', accent2: '#2e4b3c' }, fonts: { display: 'fraunces', body: 'dm-sans' }, traits: { divider: 'curve', image: 'arch' } },
  },
  {
    name: 'Midnight serif',
    theme: { preset: 'editorial', palette: { bg: '#14161a', surface: '#1d2027', ink: '#f1ece2', accent: '#e2b659', accent2: '#7fb3a6' }, fonts: { display: 'instrument-serif', body: 'inter' }, traits: { card: 'outline', divider: 'line', image: 'plain', eyebrow: 'rule' } },
  },
  {
    name: 'Forest and cream',
    theme: { preset: 'editorial', palette: { bg: '#f1ede2', surface: '#e3dcc9', ink: '#1d2a22', accent: '#2f5d46', accent2: '#c9772b' }, fonts: { display: 'playfair', body: 'source-serif' }, radius: 'md', traits: { card: 'tinted', divider: 'wave', image: 'rounded', emphasis: 'underline', eyebrow: 'caps' } },
  },
  {
    name: 'Peach soft',
    theme: { preset: 'soft' },
  },
  {
    name: 'Mint clinic',
    theme: { preset: 'soft', palette: { bg: '#f3faf7', surface: '#dff2ea', ink: '#12302a', accent: '#0f9d77', accent2: '#ffb44a' }, fonts: { display: 'sora', body: 'dm-sans' }, radius: 'lg', traits: { card: 'raised', emphasis: 'underline', divider: 'curve', motif: 'rings', image: 'blob' } },
  },
  {
    name: 'Ink and mint',
    theme: { preset: 'technical' },
  },
  {
    name: 'Blueprint',
    theme: { preset: 'technical', palette: { bg: '#f5f7fb', surface: '#e7ecf5', ink: '#0e1a33', accent: '#2456ff', accent2: '#00a99b' }, fonts: { display: 'inter-tight', body: 'inter' }, radius: 'md', traits: { card: 'raised', divider: 'slant' } },
  },
  {
    name: 'Poster',
    theme: { preset: 'bold' },
  },
  {
    name: 'Hot pink',
    theme: { preset: 'bold', palette: { bg: '#fff3f8', surface: '#ffd5e6', ink: '#1a0a12', accent: '#ff2e7e', accent2: '#3a1bff' }, fonts: { display: 'unbounded', body: 'manrope' }, radius: 'lg', traits: { caps: false, divider: 'scallop', motif: 'lines', emphasis: 'highlight' } },
  },
  {
    name: 'Black and yellow',
    theme: { preset: 'bold', palette: { bg: '#ffffff', surface: '#f1f1ee', ink: '#0a0a0a', accent: '#ffe600', accent2: '#0a0a0a' }, fonts: { display: 'anton', body: 'ibm-plex-sans' }, radius: 'none', traits: { card: 'outline', button: 'solid', divider: 'slant', motif: 'grid', image: 'plain' } },
  },
];
