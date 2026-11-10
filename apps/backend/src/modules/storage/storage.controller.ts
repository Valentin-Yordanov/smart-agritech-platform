import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateUploadUrlDto } from './dto/create-upload-url.dto';
import { PresignedUrlResponse, StorageService } from './storage.service';

@ApiTags('Storage')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('api/v1/storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload-url')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate presigned upload URL for Cloudflare R2 / S3',
    description: 'Generates a short-lived presigned PUT URL allowing clients to upload images directly to object storage.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Presigned upload URL generated successfully.',
    schema: {
      example: {
        uploadUrl: 'https://placeholder-account-id.r2.cloudflarestorage.com/agritech-uploads/uploads/leaves/abc-123.jpg?...',
        fileKey: 'uploads/leaves/abc-123.jpg',
        publicUrl: 'https://pub-placeholder.r2.dev/uploads/leaves/abc-123.jpg',
      },
    },
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Authentication required.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Validation failed.' })
  async getUploadUrl(@Body() dto: CreateUploadUrlDto): Promise<PresignedUrlResponse> {
    return this.storageService.getPresignedUploadUrl(dto.filename, dto.mimeType, dto.folder);
  }
}
