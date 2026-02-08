import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { UsersService } from '../users/users.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { BulkImportContactsDto } from './dto/bulk-import-contacts.dto';
import { UpdateDiscDto } from './dto/update-disc.dto';
import { ContactQueryDto } from './dto/contact-query.dto';
import { wrapResponse, wrapPaginatedResponse } from '../common';

@Controller('contacts')
export class ContactsController {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly usersService: UsersService,
  ) {}

  private async resolveUserId(currentUser: { auth0Id: string; email: string }) {
    const user = await this.usersService.findOrCreateFromAuth0(currentUser.auth0Id, currentUser.email);
    return user.id;
  }

  @Post()
  async create(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Body() dto: CreateContactDto,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const contact = await this.contactsService.create(userId, dto);
    return wrapResponse(contact);
  }

  @Post('bulk-import')
  async bulkImport(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Body() dto: BulkImportContactsDto,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const contacts = await this.contactsService.bulkImport(userId, dto.contacts);
    return wrapResponse(contacts, `${contacts.length} contacts imported`);
  }

  @Get()
  async findAll(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Query() query: ContactQueryDto,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const { data, total } = await this.contactsService.findAll(userId, query);
    return wrapPaginatedResponse(data, total, query.page, query.pageSize);
  }

  @Get('search')
  async search(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Query('q') q: string,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const contacts = await this.contactsService.search(userId, q || '');
    return wrapResponse(contacts);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const contact = await this.contactsService.findOne(userId, id);
    return wrapResponse(contact);
  }

  @Patch(':id')
  async update(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
    @Body() dto: UpdateContactDto,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const contact = await this.contactsService.update(userId, id, dto);
    return wrapResponse(contact);
  }

  @Patch(':id/disc')
  async updateDisc(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
    @Body() dto: UpdateDiscDto,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const contact = await this.contactsService.updateDisc(userId, id, dto);
    return wrapResponse(contact);
  }

  @Patch(':id/tier')
  async assignTier(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
    @Body('tierId') tierId: string,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const contact = await this.contactsService.assignTier(userId, id, tierId);
    return wrapResponse(contact);
  }

  @Delete(':id')
  async remove(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
  ) {
    const userId = await this.resolveUserId(currentUser);
    await this.contactsService.remove(userId, id);
    return wrapResponse(null, 'Contact deleted');
  }
}
