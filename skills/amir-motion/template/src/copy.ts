// Every visible word of the film lives here, so the FR and EN cuts stay in step.
// Pure data, no imports: the audit reads it to check reading time and forbidden names.
// Captions: one sentence per step, 10 words at most, written for a non-technical decision maker.
export type Lang = 'fr' | 'en';

export const PRODUCT = '__PRODUCT__';

export const copy = {
  fr: {
    tagline: '__PRODUCT__ fait le travail répétitif,',
    tagline2: 'votre équipe garde la main.',
    step1: 'Une demande arrive.',
    step2: 'Un clic, et elle est traitée.',
    endSub: 'Votre promesse en une ligne.',
    // Product UI words: texture, except the ones the story points at.
    listTitle: 'Demandes',
    rows: ['Relancer le client Martin', 'Mettre à jour le tarif', 'Classer les factures de mars', 'Préparer le point du lundi'],
    run: 'Lancer',
    done: 'Terminé',
  },
  en: {
    tagline: '__PRODUCT__ does the repetitive work,',
    tagline2: 'while your team stays in charge.',
    step1: 'A request comes in.',
    step2: 'One click, and it is handled.',
    endSub: 'Your promise in one line.',
    listTitle: 'Requests',
    rows: ['Follow up with Martin', 'Update the price list', 'File the March invoices', 'Prepare the Monday review'],
    run: 'Run',
    done: 'Done',
  },
} as const;

export type Copy = (typeof copy)[Lang];
export type Line = {[K in keyof Copy]: Copy[K] extends string ? K : never}[keyof Copy];
