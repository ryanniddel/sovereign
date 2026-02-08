import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class NimbleCrmService {
  private readonly logger = new Logger(NimbleCrmService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getConnectionStatus(userId: string) {
    // Phase 2: Check actual Nimble API connection
    const contactsWithCrmId = await this.prisma.contact.count({
      where: { userId, nimbleCrmId: { not: null } },
    });
    const totalContacts = await this.prisma.contact.count({ where: { userId } });

    return {
      isConnected: false,
      provider: 'nimble',
      syncedContacts: contactsWithCrmId,
      totalContacts,
      lastSyncAt: null,
      lastSyncError: null,
      message: 'Nimble CRM integration available in Phase 2',
    };
  }

  async connect(userId: string, dto: { apiKey: string; accountId?: string }) {
    this.logger.log(`Nimble CRM connect requested for user ${userId}`);
    // Phase 2: Validate API key with Nimble API, store encrypted credentials
    return {
      isConnected: false,
      message: 'Nimble CRM connection will be available in Phase 2. API key noted but not stored.',
    };
  }

  async disconnect(userId: string) {
    this.logger.log(`Nimble CRM disconnect requested for user ${userId}`);
    // Phase 2: Revoke token, clear sync config
    // For now, clear any nimbleCrmId references
    await this.prisma.contact.updateMany({
      where: { userId, nimbleCrmId: { not: null } },
      data: { nimbleCrmId: null },
    });

    return { message: 'Nimble CRM IDs cleared from contacts' };
  }

  async syncAll(userId: string, direction: 'inbound' | 'outbound' | 'both' = 'both') {
    this.logger.log(`Nimble CRM sync requested for user ${userId}, direction: ${direction}`);
    // Phase 2: Full bidirectional sync with conflict resolution
    return {
      status: 'not_available',
      direction,
      message: 'Full Nimble CRM sync will be available in Phase 2',
      contactsProcessed: 0,
      contactsCreated: 0,
      contactsUpdated: 0,
      contactsFailed: 0,
      errors: [],
    };
  }

  async pushContact(userId: string, contactId: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id: contactId, userId },
    });
    if (!contact) {
      return { success: false, message: 'Contact not found' };
    }

    this.logger.log(`Push contact ${contactId} to Nimble CRM requested`);
    // Phase 2: Map Sovereign contact fields to Nimble contact fields, POST to Nimble API
    return {
      success: false,
      contactId,
      nimbleCrmId: contact.nimbleCrmId,
      message: 'Nimble CRM push will be available in Phase 2',
      mappedFields: {
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        company: contact.company,
        title: contact.title,
      },
    };
  }

  async pullContact(userId: string, nimbleCrmId: string) {
    this.logger.log(`Pull contact ${nimbleCrmId} from Nimble CRM requested`);
    // Phase 2: GET from Nimble API, map to Sovereign contact, upsert
    return {
      success: false,
      nimbleCrmId,
      message: 'Nimble CRM pull will be available in Phase 2',
    };
  }

  async getMappedContacts(userId: string) {
    const contacts = await this.prisma.contact.findMany({
      where: { userId, nimbleCrmId: { not: null } },
      select: {
        id: true,
        name: true,
        email: true,
        nimbleCrmId: true,
        updatedAt: true,
      },
    });

    return {
      total: contacts.length,
      contacts,
    };
  }
}
