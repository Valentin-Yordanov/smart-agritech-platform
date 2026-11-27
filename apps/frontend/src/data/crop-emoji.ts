// Visual markers for crops, pests and plant parts, shared by the landing explorer and the knowledge base

const CROP_EMOJI: Record<string, string> = {
  Apple: '🍎',
  Apricot: '🍑',
  Banana: '🍌',
  Bean: '🫘',
  'Bell Pepper': '🫑',
  'Bitter Gourd': '🥒',
  Blueberry: '🫐',
  'Bottle Gourd': '🥒',
  Cashew: '🌰',
  Cassava: '🍠',
  Cauliflower: '🥦',
  Cherry: '🍒',
  Citrus: '🍊',
  Coffee: '☕',
  'Corn (Maize)': '🌽',
  Cotton: '☁️',
  Cowpea: '🫘',
  Cucumber: '🥒',
  'Date Palm': '🌴',
  Eggplant: '🍆',
  Fig: '🌳',
  Grape: '🍇',
  Grapevine: '🍇',
  Groundnut: '🥜',
  Guava: '🍐',
  Jujube: '🍒',
  Lentil: '🫘',
  Lettuce: '🥬',
  Loquat: '🍑',
  Mango: '🥭',
  Onion: '🧅',
  Papaya: '🍈',
  Peach: '🍑',
  Pear: '🍐',
  Pepper: '🫑',
  Persimmon: '🍊',
  Plum: '🍇',
  Pomegranate: '🍎',
  Potato: '🥔',
  Quince: '🍐',
  Raspberry: '🍓',
  Rice: '🌾',
  Soybean: '🫘',
  Squash: '🎃',
  Strawberry: '🍓',
  Sugarcane: '🎋',
  Sunflower: '🌻',
  Tea: '🍵',
  Tomato: '🍅',
  Walnut: '🌰',
  Watermelon: '🍉',
  Wheat: '🌾',
};

const PEST_EMOJI: [RegExp, string][] = [
  [/mite/, '🕷️'],
  [/beetle|hispa/, '🪲'],
  [/grasshopper/, '🦗'],
  [/mealybug|mirid/, '🐞'],
  [/jassid|helopeltis/, '🦟'],
  [/insect/, '🐜'],
];

const PART_EMOJI: Record<string, string> = {
  leaf: '🍃',
  ear: '🌾',
  panicle: '🌾',
  stem: '🎋',
  tuber: '🥔',
  bulb: '🧅',
  head: '🥬',
  nut: '🌰',
  plant: '🌱',
};

export const PATHOGEN_EMOJI: Record<string, string> = {
  Fungal: '🍄',
  Oomycete: '💧',
  'Bacterial / Pest': '🦠',
  Viral: '🧬',
};

export function cropEmoji(crop: string): string {
  return CROP_EMOJI[crop] ?? '🌱';
}

// Caterpillar-type damage (armyworm, borer, miner, looper…) falls back to 🐛
export function pestEmoji(className: string): string {
  const name = className.toLowerCase();
  return PEST_EMOJI.find(([re]) => re.test(name))?.[1] ?? '🐛';
}

export function partEmoji(part: string, crop: string): string {
  return part === 'fruit' ? cropEmoji(crop) : (PART_EMOJI[part] ?? '🌱');
}
