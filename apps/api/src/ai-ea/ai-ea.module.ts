import { Module } from '@nestjs/common';
import { AiEaController } from './ai-ea.controller';
import { AiEaService } from './ai-ea.service';

@Module({
  controllers: [AiEaController],
  providers: [AiEaService],
  exports: [AiEaService],
})
export class AiEaModule {}
