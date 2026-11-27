import { CONFIDENCE_THRESHOLD } from '@/lib/edge-inference';

// Facts about the deployed v2 models, shown in the footer, landing page and scanner.
// Keep in sync with docs/model_reports/v2/report.json when models are retrained.
export const MODEL_INFO = {
  version: 'v2',
  detector: 'YOLO11n',
  detectorClasses: ['leaf', 'fruit', 'ear', 'pest'],
  classifier: 'EfficientNet-B0',
  classCount: 266,
  cropCount: 50,
  confidenceThreshold: CONFIDENCE_THRESHOLD,
  classifierMb: 17.4,
  detectorMb: 10.7,
} as const;

export const CREDITS_FILES = [
  { href: '/models/DATASET_CREDITS.csv', label: 'DATASET_CREDITS.csv' },
  { href: '/models/IMAGE_ATTRIBUTIONS.csv', label: 'IMAGE_ATTRIBUTIONS.csv' },
] as const;

export interface SampleSpecimen {
  file: string;
  label: string;
  hint: string;
}

export const SAMPLE_SPECIMENS: SampleSpecimen[] = [
  { file: '/samples/banana_leaf_sigatoka.jpg', label: 'Banana leaf', hint: 'Sigatoka' },
  { file: '/samples/maize_leaf_streak.jpg', label: 'Maize leaf', hint: 'Streak virus' },
  { file: '/samples/apple_leaf_alternaria.jpg', label: 'Apple leaf', hint: 'Alternaria' },
  { file: '/samples/non_plant_brick.jpg', label: 'Not a plant', hint: 'Tests the uncertain fallback' },
];

export function isUncertainResult(speciesName: string, diseaseName: string): boolean {
  return /uncertain/i.test(diseaseName) || speciesName.toLowerCase() === 'unknown';
}
