import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DiagnosisService, EnqueueResponse } from './diagnosis.service';
import { CreateDiagnosisJobDto } from './dto/create-diagnosis-job.dto';

@ApiTags('Diagnoses')
@ApiBearerAuth('JWT-auth')
@Controller('api/v1/diagnoses')
export class DiagnosisController {
  constructor(private readonly diagnosisService: DiagnosisService) {}

  @Post('queue')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Queue leaf diagnosis job for asynchronous AI inference',
    description: 'Creates a pending diagnosis record in PostgreSQL and enqueues the job into Redis/BullMQ.',
  })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'Job enqueued successfully.',
    schema: {
      example: {
        diagnosisId: '6b568fd6-5e58-4bc2-8d7d-5a82fa2c10b2',
        status: 'PENDING',
        jobId: '1',
        message: 'Diagnosis job successfully enqueued for asynchronous AI inference.',
      },
    },
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid payload or coordinates out of range.' })
  async queueDiagnosis(@Body() dto: CreateDiagnosisJobDto): Promise<EnqueueResponse> {
    return await this.diagnosisService.enqueueDiagnosis(dto);
  }

  @Get('outbreaks')
  @ApiOperation({
    summary: 'Retrieve crop disease outbreak locations',
    description: 'Fetches geo-coordinates and disease summaries for all infected crops detected across the network.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of crop disease outbreaks with coordinates and severity metadata.',
    schema: {
      example: {
        totalOutbreaks: 1,
        outbreaks: [
          {
            id: '6b568fd6-5e58-4bc2-8d7d-5a82fa2c10b2',
            speciesName: 'Tomato',
            diseaseName: 'Tomato Early Blight',
            confidence: 0.8842,
            latitude: 42.6977,
            longitude: 23.3219,
            imageUrl: 'uploads/plants/tomato-blight.jpg',
            createdAt: '2026-11-09T18:00:00.000Z',
            severity: 'Moderate',
            recommendations: ['Prune lower 12 inches of foliage...', 'Apply copper octanoate.'],
          },
        ],
      },
    },
  })
  async getOutbreaks() {
    return await this.diagnosisService.getOutbreaks();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get diagnosis status and results by ID',
    description: 'Returns diagnosis processing status, identified species, disease, confidence, and treatment plan.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID of the diagnosis record',
    example: '6b568fd6-5e58-4bc2-8d7d-5a82fa2c10b2',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Diagnosis details retrieved successfully.',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Diagnosis record not found.' })
  async getDiagnosisById(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return await this.diagnosisService.getDiagnosisById(id);
  }
}
