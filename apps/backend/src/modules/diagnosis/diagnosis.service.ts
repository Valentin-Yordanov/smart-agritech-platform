import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDiagnosisJobDto } from './dto/create-diagnosis-job.dto';

export const DIAGNOSIS_QUEUE_NAME = 'diagnosis-queue';

export interface EnqueueResponse {
  diagnosisId: string;
  status: 'PENDING';
  jobId: string;
  message: string;
}

export interface OutbreakItem {
  id: string;
  speciesName: string;
  diseaseName: string;
  confidence: number;
  latitude: number;
  longitude: number;
  imageUrl: string;
  createdAt: Date;
  severity?: string;
  recommendations?: string[];
}

@Injectable()
export class DiagnosisService {
  private readonly logger = new Logger(DiagnosisService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(DIAGNOSIS_QUEUE_NAME) private readonly diagnosisQueue: Queue,
  ) {}

  /**
   * Ensures a valid user exists for foreign key integrity.
   * If a userId is supplied, verifies it. Otherwise, finds the first user or creates a default demo user.
   */
  private async resolveUserId(userId?: string): Promise<string> {
    if (userId) {
      const existingUser = await this.prisma.user.findUnique({ where: { id: userId } });
      if (existingUser) {
        return existingUser.id;
      }
    }

    // Fallback: look for an existing user or create a persistent demo user
    const firstUser = await this.prisma.user.findFirst();
    if (firstUser) {
      return firstUser.id;
    }

    const demoUser = await this.prisma.user.upsert({
      where: { email: 'demo.farmer@agritech.local' },
      update: {},
      create: {
        email: 'demo.farmer@agritech.local',
        fullName: 'Demo Agronomist',
        passwordHash: '$2a$10$wT5f/6vRzJb9sDqJbZ1kIe1Hh8L6j0rB5eU4yC7a9qXwFvK3mY2e.', // Placeholder bcrypt
      },
    });

    return demoUser.id;
  }

  /**
   * Creates a pending Diagnosis record in Prisma and enqueues the inference job into BullMQ.
   */
  async enqueueDiagnosis(dto: CreateDiagnosisJobDto): Promise<EnqueueResponse> {
    const assignedUserId = await this.resolveUserId(dto.userId);

    // Create the pending Diagnosis entry with initial baseline values
    const pendingDiagnosis = await this.prisma.diagnosis.create({
      data: {
        userId: assignedUserId,
        imageUrl: dto.imageKey,
        latitude: dto.latitude ?? null,
        longitude: dto.longitude ?? null,
        speciesName: 'Pending Identification',
        diseaseName: 'PROCESSING',
        confidence: 0.0,
        isHealthy: true,
        rawDetections: [],
        treatmentPlan: {
          status: 'PENDING',
          message: 'Inference job queued for AI vision analysis.',
          enqueuedAt: new Date().toISOString(),
        },
      },
    });

    this.logger.log(`Created pending diagnosis ${pendingDiagnosis.id}. Enqueuing to BullMQ...`);

    // Enqueue job into BullMQ
    const job = await this.diagnosisQueue.add(
      'analyze-leaf',
      {
        diagnosisId: pendingDiagnosis.id,
        imageKey: dto.imageKey,
        latitude: dto.latitude,
        longitude: dto.longitude,
        userId: assignedUserId,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
      },
    );

    return {
      diagnosisId: pendingDiagnosis.id,
      status: 'PENDING',
      jobId: String(job.id),
      message: 'Diagnosis job successfully enqueued for asynchronous AI inference.',
    };
  }

  /**
   * Retrieves diagnosis details by ID.
   */
  async getDiagnosisById(id: string) {
    const diagnosis = await this.prisma.diagnosis.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!diagnosis) {
      throw new NotFoundException(`Diagnosis record with ID "${id}" was not found.`);
    }

    const treatment = (diagnosis.treatmentPlan as Record<string, any>) || {};

    return {
      id: diagnosis.id,
      status: treatment.status || (diagnosis.diseaseName === 'PROCESSING' ? 'PENDING' : 'COMPLETED'),
      species: diagnosis.speciesName,
      disease: diagnosis.diseaseName,
      confidence: diagnosis.confidence,
      isHealthy: diagnosis.isHealthy,
      imageUrl: diagnosis.imageUrl,
      latitude: diagnosis.latitude,
      longitude: diagnosis.longitude,
      treatmentPlan: diagnosis.treatmentPlan,
      rawDetections: diagnosis.rawDetections,
      createdAt: diagnosis.createdAt,
      user: diagnosis.user,
    };
  }

  /**
   * Returns geo-coordinates and disease summaries for infected crops across the network.
   */
  async getOutbreaks(): Promise<{ totalOutbreaks: number; outbreaks: OutbreakItem[] }> {
    const infectedDiagnoses = await this.prisma.diagnosis.findMany({
      where: {
        isHealthy: false,
        latitude: { not: null },
        longitude: { not: null },
        NOT: {
          diseaseName: { in: ['PROCESSING', 'Pending Identification', 'FAILED'] },
        },
      },
      select: {
        id: true,
        speciesName: true,
        diseaseName: true,
        confidence: true,
        latitude: true,
        longitude: true,
        imageUrl: true,
        createdAt: true,
        treatmentPlan: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const outbreaks: OutbreakItem[] = infectedDiagnoses.map((record) => {
      const treatment = (record.treatmentPlan as Record<string, any>) || {};
      return {
        id: record.id,
        speciesName: record.speciesName,
        diseaseName: record.diseaseName,
        confidence: record.confidence,
        latitude: record.latitude!,
        longitude: record.longitude!,
        imageUrl: record.imageUrl,
        createdAt: record.createdAt,
        severity: treatment.severity,
        recommendations: treatment.recommendations,
      };
    });

    return {
      totalOutbreaks: outbreaks.length,
      outbreaks,
    };
  }
}
