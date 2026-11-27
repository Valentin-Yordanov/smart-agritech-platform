export type CoverageCategory = 'orchard' | 'field' | 'greenhouse' | 'pests';

export const COVERAGE_CATEGORIES: { key: CoverageCategory; label: string; description: string }[] = [
  { key: 'orchard', label: 'Orchard & Plantation', description: 'Tree fruit, nuts, vines and plantation crops' },
  { key: 'field', label: 'Field Crops', description: 'Cereals, pulses, oilseeds, roots and fibre' },
  { key: 'greenhouse', label: 'Greenhouse Produce', description: 'Vegetables, gourds and berries' },
  { key: 'pests', label: 'Pests', description: 'Insect and mite damage the model recognises' },
];

const CROP_CATEGORY: Record<string, Exclude<CoverageCategory, 'pests'>> = {
  Apple: 'orchard', Apricot: 'orchard', Banana: 'orchard', Cashew: 'orchard', Cherry: 'orchard',
  Citrus: 'orchard', Coffee: 'orchard', 'Date Palm': 'orchard', Fig: 'orchard', Grape: 'orchard',
  Guava: 'orchard', Jujube: 'orchard', Loquat: 'orchard', Mango: 'orchard', Papaya: 'orchard',
  Peach: 'orchard', Pear: 'orchard', Persimmon: 'orchard', Plum: 'orchard', Pomegranate: 'orchard',
  Quince: 'orchard', Tea: 'orchard', Walnut: 'orchard',
  Bean: 'field', Cassava: 'field', 'Corn (Maize)': 'field', Cotton: 'field', Cowpea: 'field',
  Groundnut: 'field', Lentil: 'field', Onion: 'field', Potato: 'field', Rice: 'field',
  Soybean: 'field', Sugarcane: 'field', Sunflower: 'field', Wheat: 'field',
};

const PEST_PATTERN =
  /armyworm|mite|helopeltis|hispa|semilooper|beetle|grasshopper|borer|jassid|mealybug|leaf_miner|leaffolder|mirid|insect|dead_heart/;

export interface CoverageCondition {
  className: string;
  label: string;
  part: string;
  isHealthy: boolean;
  isPest: boolean;
}

export interface CoverageCrop {
  name: string;
  category: Exclude<CoverageCategory, 'pests'>;
  conditions: CoverageCondition[];
}

interface ClassEntry {
  class_name: string;
  species: string;
  disease: string;
  is_healthy: boolean;
  plant_part?: string;
}

function prettify(raw: string): string {
  const s = raw.replace(/_/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Groups the deployed classes.json by crop so the landing page always reflects the live model
export function buildCoverage(entries: ClassEntry[]): CoverageCrop[] {
  const byCrop = new Map<string, CoverageCrop>();

  for (const e of entries) {
    if (!e.class_name.includes('___')) continue;
    const [head, condition] = e.class_name.split('___');
    const part = e.plant_part && e.plant_part !== 'none' ? e.plant_part : head.split('_').pop() ?? 'leaf';
    const crop =
      byCrop.get(e.species) ??
      { name: e.species, category: CROP_CATEGORY[e.species] ?? 'greenhouse', conditions: [] };

    crop.conditions.push({
      className: e.class_name,
      label: e.is_healthy ? 'Healthy' : prettify(condition),
      part,
      isHealthy: e.is_healthy,
      isPest: PEST_PATTERN.test(condition),
    });
    byCrop.set(e.species, crop);
  }

  return [...byCrop.values()].sort((a, b) => a.name.localeCompare(b.name));
}
