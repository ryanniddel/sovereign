import { Module } from '@nestjs/common';
import { ContactTiersController } from './contact-tiers.controller';
import { ContactTiersService } from './contact-tiers.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [ContactTiersController],
  providers: [ContactTiersService],
  exports: [ContactTiersService],
})
export class ContactTiersModule {}
