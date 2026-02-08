import { Module } from '@nestjs/common';
import { CommitmentsController } from './commitments.controller';
import { CommitmentsService } from './commitments.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [CommitmentsController],
  providers: [CommitmentsService],
  exports: [CommitmentsService],
})
export class CommitmentsModule {}
