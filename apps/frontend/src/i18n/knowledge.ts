import type { AgronomyGuide } from '@/data/knowledge-base';
import { KNOWLEDGE_GUIDES_BG } from '@/data/knowledge-base.bg';
import type { Language } from '@/i18n/config';

function localizePhi(value: string): string {
  return value.replace(/See label/gi, 'Вижте етикета').replace(/days?/gi, 'дни');
}

/** Returns the guide in the requested language, falling back to English for anything not translated. */
export function localizeGuide(guide: AgronomyGuide, lang: Language): AgronomyGuide {
  if (lang === 'en') return guide;
  const bg = KNOWLEDGE_GUIDES_BG[guide.slug];
  if (!bg) return guide;

  return {
    ...guide,
    title: bg.title,
    hostCrop: bg.hostCrop,
    summary: bg.summary,
    optimalConditions: bg.optimalConditions,
    symptomsChecklist: bg.symptomsChecklist.length ? bg.symptomsChecklist : guide.symptomsChecklist,
    biologicalControls: bg.biologicalControls.length ? bg.biologicalControls : guide.biologicalControls,
    chemicalProtocols: guide.chemicalProtocols.map((protocol, i) => ({
      ...protocol,
      phiDays: localizePhi(protocol.phiDays),
      notes: bg.chemicalNotes[i] ?? protocol.notes,
    })),
    culturalPractices: bg.culturalPractices.length ? bg.culturalPractices : guide.culturalPractices,
  };
}

/** Disease part of a guide title ("Tomato — Early Blight" -> "Early Blight"). */
export function diseaseFromTitle(title: string): string {
  return title.split('—')[1]?.trim() || title;
}
