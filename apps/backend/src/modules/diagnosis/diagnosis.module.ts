import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DiagnosisController } from './diagnosis.controller';
import { DiagnosisProcessor } from './diagnosis.processor';
import { DiagnosisService, DIAGNOSIS_QUEUE_NAME } from './diagnosis.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: DIAGNOSIS_QUEUE_NAME,
    }),
  ],
  controllers: [DiagnosisController],
  providers: [DiagnosisService, DiagnosisProcessor],
  exports: [DiagnosisService, BullModule],
})
export class DiagnosisModule {}
