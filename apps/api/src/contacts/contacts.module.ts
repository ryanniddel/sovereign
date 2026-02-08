import { Module } from '@nestjs/common';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { RelationshipDecayProcessor } from './processors/relationship-decay.processor';
import { UsersModule } from '../users/users.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [UsersModule, QueueModule],
  controllers: [ContactsController],
  providers: [ContactsService, RelationshipDecayProcessor],
  exports: [ContactsService],
})
export class ContactsModule {}
