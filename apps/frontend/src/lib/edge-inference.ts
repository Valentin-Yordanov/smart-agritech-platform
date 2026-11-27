import type * as OrtType from 'onnxruntime-web';

export interface EdgeInferenceResult {
  speciesName: string;
  diseaseName: string;
  confidence: number;
  isHealthy: boolean;
}

interface ClassificationClassEntry {
  id: number;
  class_name: string;
  species: string;
  disease: string;
  is_healthy: boolean;
  severity?: string;
  treatment?: string;
  plant_part?: string;
}

interface ClassesJsonPayload {
  classification_classes?: ClassificationClassEntry[];
}

const INPUT_SIZE = 224;
const IMAGENET_MEAN: [number, number, number] = [0.485, 0.456, 0.406];
const IMAGENET_STD: [number, number, number] = [0.229, 0.224, 0.225];
export const CONFIDENCE_THRESHOLD = 0.75;
const UNKNOWN_CLASS_NAMES = ['unknown', 'not_a_plant_leaf'];

let cachedSession: OrtType.InferenceSession | null = null;
let cachedClasses: ClassificationClassEntry[] | null = null;

async function loadClasses(): Promise<ClassificationClassEntry[]> {
  if (cachedClasses) return cachedClasses;

  const response = await fetch('/models/classes.json');
  if (!response.ok) {
    throw new Error(`Failed to load classes.json (${response.status})`);
  }

  const json = (await response.json()) as
    | ClassesJsonPayload
    | ClassificationClassEntry[];

  const classes = Array.isArray(json)
    ? json
    : json.classification_classes ?? [];

  if (classes.length === 0) {
    throw new Error('No classification classes found in /models/classes.json');
  }

  cachedClasses = classes;
  return classes;
}

async function loadImageElement(source: File | HTMLImageElement): Promise<HTMLImageElement> {
  if (typeof HTMLImageElement !== 'undefined' && source instanceof HTMLImageElement) {
    if (source.complete && source.naturalWidth > 0) {
      return source;
    }
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      source.onload = () => resolve(source);
      source.onerror = () => reject(new Error('Failed to load image element'));
    });
  }

  const file = source as File;
  const objectUrl = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to decode uploaded image'));
      img.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function preprocessToNchwTensor(img: HTMLImageElement): Float32Array {
  const canvas = document.createElement('canvas');
  canvas.width = INPUT_SIZE;
  canvas.height = INPUT_SIZE;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not initialize 2D canvas context for preprocessing');
  }

  ctx.drawImage(img, 0, 0, INPUT_SIZE, INPUT_SIZE);
  const { data } = ctx.getImageData(0, 0, INPUT_SIZE, INPUT_SIZE);

  const channelSize = INPUT_SIZE * INPUT_SIZE;
  const float32Data = new Float32Array(3 * channelSize);

  for (let i = 0; i < channelSize; i++) {
    const rgbaOffset = i * 4;
    const r = data[rgbaOffset] / 255.0;
    const g = data[rgbaOffset + 1] / 255.0;
    const b = data[rgbaOffset + 2] / 255.0;

    float32Data[i] = (r - IMAGENET_MEAN[0]) / IMAGENET_STD[0];
    float32Data[channelSize + i] = (g - IMAGENET_MEAN[1]) / IMAGENET_STD[1];
    float32Data[2 * channelSize + i] = (b - IMAGENET_MEAN[2]) / IMAGENET_STD[2];
  }

  return float32Data;
}

function softmax(logits: Float32Array): number[] {
  let maxLogit = -Infinity;
  for (let i = 0; i < logits.length; i++) {
    if (logits[i] > maxLogit) {
      maxLogit = logits[i];
    }
  }

  const exps: number[] = new Array(logits.length);
  let sumExp = 0;
  for (let i = 0; i < logits.length; i++) {
    const val = Math.exp(logits[i] - maxLogit);
    exps[i] = val;
    sumExp += val;
  }

  return exps.map((v) => v / sumExp);
}

export async function runEdgeInference(
  source: File | HTMLImageElement
): Promise<EdgeInferenceResult> {
  const ort = await import('onnxruntime-web');
  ort.env.wasm.wasmPaths =
    'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/';

  const [classes, img] = await Promise.all([
    loadClasses(),
    loadImageElement(source),
  ]);

  if (!cachedSession) {
    cachedSession = await ort.InferenceSession.create(
      '/models/mobilenetv4_plant_disease.onnx',
      {
        executionProviders: ['wasm'],
      }
    );
  }

  const tensorData = preprocessToNchwTensor(img);
  const inputTensor = new ort.Tensor('float32', tensorData, [
    1,
    3,
    INPUT_SIZE,
    INPUT_SIZE,
  ]);

  const inputName = cachedSession.inputNames[0];
  const outputName = cachedSession.outputNames[0];

  const outputs = await cachedSession.run({ [inputName]: inputTensor });
  const outputTensor = outputs[outputName];
  const logits = outputTensor.data as Float32Array;

  const probabilities = softmax(logits);

  let bestIndex = 0;
  let bestProb = -1;
  for (let i = 0; i < probabilities.length; i++) {
    if (probabilities[i] > bestProb) {
      bestProb = probabilities[i];
      bestIndex = i;
    }
  }

  const matchedClass =
    classes.find((c) => c.id === bestIndex) ?? classes[bestIndex];

  if (!matchedClass) {
    throw new Error(`Predicted class index ${bestIndex} not found in classes.json`);
  }

  // Low confidence or the "unknown" class means the photo should be retaken
  if (
    bestProb < CONFIDENCE_THRESHOLD ||
    UNKNOWN_CLASS_NAMES.includes(matchedClass.class_name.toLowerCase())
  ) {
    return {
      speciesName: 'Unknown',
      diseaseName: 'Uncertain - retake photo',
      confidence: bestProb,
      isHealthy: false,
    };
  }

  const part =
    matchedClass.plant_part && !['leaf', 'none'].includes(matchedClass.plant_part)
      ? ` (${matchedClass.plant_part})`
      : '';

  return {
    speciesName: matchedClass.species,
    diseaseName: (matchedClass.is_healthy ? 'Healthy' : matchedClass.disease) + part,
    confidence: bestProb,
    isHealthy: matchedClass.is_healthy,
  };
}
