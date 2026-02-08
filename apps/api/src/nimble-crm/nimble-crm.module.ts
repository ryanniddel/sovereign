import { Module } from '@nestjs/common';
import { NimbleCrmController } from './nimble-crm.controller';
import { NimbleCrmService } from './nimble-crm.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [NimbleCrmController],
  providers: [NimbleCrmService],
  exports: [NimbleCrmService],
})
export class NimbleCrmModule {}
