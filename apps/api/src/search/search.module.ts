import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { SearchCleanupProcessor } from './processors/search-cleanup.processor';
import { UsersModule } from '../users/users.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [UsersModule, QueueModule],
  controllers: [SearchController],
  providers: [SearchService, SearchCleanupProcessor],
})
export class SearchModule {}
