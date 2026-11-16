import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../../prisma/prisma.service';
import { DIAGNOSIS_QUEUE_NAME } from './diagnosis.service';
import { Prisma } from '@prisma/client';

export interface DiagnosisJobPayload {
  diagnosisId: string;
  imageKey: string;
  latitude?: number;
  longitude?: number;
  userId?: string;
}

interface AiServiceDiagnosisResponse {
  status: 'HEALTHY' | 'DISEASED' | 'PEST_INFESTATION' | 'UNCERTAIN';
  primary_species: string;
  primary_disease: string;
  overall_health_score: number;
  severity_level: string;
  regions_analyzed: number;
  regions: Array<{
    region_id: number;
    box: { x_min: number; y_min: number; x_max: number; y_max: number; width: number; height: number };
    detection_label: string;
    detection_confidence: number;
    classification: {
      predictions: Array<{
        class_id: number;
        class_name: string;
        confidence: number;
        species: string;
        disease: string;
        is_healthy: boolean;
        severity: string;
        treatment?: string;
      }>;
      top_prediction: {
        class_id: number;
        class_name: string;
        confidence: number;
        species: string;
        disease: string;
        is_healthy: boolean;
        severity: string;
        treatment?: string;
      };
      latency_ms: number;
    };
  }>;
  recommendations: string[];
  latencies: {
    decode_and_preprocess_ms: number;
    detection_ms: number;
    crop_ms: number;
    classification_ms: number;
    total_pipeline_ms: number;
    sub_100ms_target_met: boolean;
  };
  timestamp: string;
}

@Processor(DIAGNOSIS_QUEUE_NAME)
export class DiagnosisProcessor extends WorkerHost {
  private readonly logger = new Logger(DiagnosisProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  /**
   * Resolves the image bytes from an HTTP URL, Cloudflare R2 public bucket, local file path, or synthetic fallback.
   */
  private async resolveImageBuffer(imageKey: string): Promise<Buffer> {
    // 1. If imageKey is a direct HTTP/HTTPS URL
    if (imageKey.startsWith('http://') || imageKey.startsWith('https://')) {
      this.logger.debug(`Fetching image from remote URL: ${imageKey}`);
      const res = await fetch(imageKey);
      if (!res.ok) {
        throw new Error(`Failed to fetch image from remote URL: ${res.statusText}`);
      }
      const arrayBuf = await res.arrayBuffer();
      return Buffer.from(arrayBuf);
    }

    // 2. Check Cloudflare R2 public URL if configured
    const r2PublicDomain = (
      this.configService.get<string>('R2_PUBLIC_DOMAIN') ||
      this.configService.get<string>('R2_PUBLIC_URL') ||
      ''
    ).replace(/\/+$/, '');

    if (
      r2PublicDomain &&
      !r2PublicDomain.includes('pub-placeholder.r2.dev')
    ) {
      const cleanKey = imageKey.replace(/^\/+/, '');
      const remoteUrl = `${r2PublicDomain}/${cleanKey}`;
      this.logger.debug(`Fetching uploaded image from Cloudflare R2: ${remoteUrl}`);
      const res = await fetch(remoteUrl);
      if (!res.ok) {
        throw new Error(
          `Failed to fetch image from R2 (${remoteUrl}): ${res.status} ${res.statusText}`,
        );
      }
      const arrayBuf = await res.arrayBuffer();
      return Buffer.from(arrayBuf);
    }

    // 3. Check direct absolute or relative filesystem path
    const candidatePaths = [
      imageKey,
      path.resolve(process.cwd(), imageKey),
      path.resolve(process.cwd(), '..', '..', imageKey),
    ];

    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        this.logger.debug(`Resolved local image file at: ${p}`);
        return await fs.promises.readFile(p);
      }
    }

    // 4. Fallback: Minimal valid JPEG binary buffer for simulated keys in dev/test
    this.logger.warn(
      `Image file "${imageKey}" not found on disk or remote. Using simulated valid leaf specimen buffer.`,
    );
    // Base64-encoded valid 1x1 green pixel JPEG
    const fallbackBase64 =
      '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
    return Buffer.from(fallbackBase64, 'base64');
  }

  /**
   * Worker handler executed by BullMQ for each enqueued leaf diagnosis job.
   */
  async process(job: Job<DiagnosisJobPayload>): Promise<AiServiceDiagnosisResponse> {
    const { diagnosisId, imageKey } = job.data;
    const baseAiUrl = this.configService
      .get<string>('AI_SERVICE_URL', 'http://localhost:8000')
      .replace(/\/+$/, '');
    const aiServiceUrl = baseAiUrl.endsWith('/api/v1/diagnose')
      ? baseAiUrl
      : `${baseAiUrl}/api/v1/diagnose`;

    this.logger.log(`Processing Job ${job.id} for Diagnosis ${diagnosisId} (Image: ${imageKey})`);

    try {
      // 1. Resolve image buffer
      const imageBuffer = await this.resolveImageBuffer(imageKey);

      // 2. Construct multipart/form-data payload for FastAPI AI microservice
      const formData = new FormData();
      const filename = path.basename(imageKey) || 'specimen.jpg';
      const fileBlob = new Blob([new Uint8Array(imageBuffer)], { type: 'image/jpeg' });
      formData.append('file', fileBlob, filename);

      this.logger.debug(`Dispatching inference request to AI microservice at ${aiServiceUrl}`);
      const response = await fetch(aiServiceUrl, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(20000), // 20s timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `AI microservice responded with status ${response.status}: ${errorText || response.statusText}`,
        );
      }

      const aiResult = (await response.json()) as AiServiceDiagnosisResponse;
      this.logger.log(
        `AI inference successful for Diagnosis ${diagnosisId}: ${aiResult.primary_species} - ${aiResult.primary_disease} (${aiResult.status}) in ${aiResult.latencies?.total_pipeline_ms}ms`,
      );

      // 3. Update the Prisma database record with the full diagnostic verdict
      const calculatedConfidence =
        aiResult.regions && aiResult.regions.length > 0 && aiResult.regions[0].classification?.top_prediction
          ? aiResult.regions[0].classification.top_prediction.confidence
          : Math.min(1.0, Math.max(0.0, (aiResult.overall_health_score ?? 100) / 100));

      const normalizedDetections = (aiResult.regions ?? []).map((region) => ({
        ...region,
        bbox: [
          region.box.x_min,
          region.box.y_min,
          region.box.x_max,
          region.box.y_max,
        ] as [number, number, number, number],
        confidence:
          region.classification?.top_prediction?.confidence ??
          region.detection_confidence,
        class_name:
          region.classification?.top_prediction?.class_name ??
          region.detection_label,
        species: region.classification?.top_prediction?.species,
        disease: region.classification?.top_prediction?.disease,
        is_healthy: region.classification?.top_prediction?.is_healthy,
      }));

      await this.prisma.diagnosis.update({
        where: { id: diagnosisId },
        data: {
          speciesName: aiResult.primary_species || 'Unknown Crop',
          diseaseName: aiResult.primary_disease || (aiResult.status === 'HEALTHY' ? 'None' : 'Pathology Detected'),
          confidence: calculatedConfidence,
          isHealthy: aiResult.status === 'HEALTHY',
          rawDetections: normalizedDetections as unknown as Prisma.InputJsonValue,
          treatmentPlan: {
            status: aiResult.status,
            severityLevel: aiResult.severity_level,
            overallHealthScore: aiResult.overall_health_score,
            recommendations: aiResult.recommendations,
            latencies: aiResult.latencies,
            diagnosedAt: aiResult.timestamp || new Date().toISOString(),
          } as unknown as Prisma.InputJsonValue,
        },
      });

      return aiResult;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Inference processing failed for Diagnosis ${diagnosisId} (Job ${job.id}): ${errorMessage}`,
        errorStack,
      );

      // Update database record to reflect failure state
      await this.prisma.diagnosis.update({
        where: { id: diagnosisId },
        data: {
          diseaseName: 'FAILED',
          treatmentPlan: {
            status: 'FAILED',
            error: errorMessage,
            failedAt: new Date().toISOString(),
          } as unknown as Prisma.InputJsonValue,
        },
      }).catch((dbErr: unknown) => {
        const dbMessage = dbErr instanceof Error ? dbErr.message : String(dbErr);
        this.logger.error(`Could not persist failure status for Diagnosis ${diagnosisId}: ${dbMessage}`);
      });

      throw error;
    }
  }
}
