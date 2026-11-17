// A hand-written site, stored as the same stream of operations the AI produces
// (northfold.json). Loading it exercises the real pipeline, and it doubles as the
// demo-mode response when no API key is configured.

import ops from './northfold.json';

export const NORTHFOLD_BRIEF =
  'Northfold Coffee Roasters: a small-batch roastery in Leeds that sells single-origin coffee by subscription. Beans are roasted to order and delivered within 48 hours. Buys direct from six partner farms and publishes what it pays. Calm, premium, a little bookish.';

export const NORTHFOLD_OPS: unknown[] = ops;

/** One-click briefs chosen to pull the presets in different directions. */
export const EXAMPLE_BRIEFS = [
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
