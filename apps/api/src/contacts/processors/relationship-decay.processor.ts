import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../database/prisma.service';

@Processor('ai-processing')
export class RelationshipDecayProcessor extends WorkerHost {
  private readonly logger = new Logger(RelationshipDecayProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job) {
    if (job.name !== 'relationship-score-decay') return;

    this.logger.log('Processing relationship score decay');

    const now = new Date();

    // Find contacts with no interaction in the last 30 days
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    let decayed = 0;

    // Tier-based decay rates:
    // 30-60 days inactive: -1 point/day
    // 60-90 days inactive: -2 points/day
    // 90+ days inactive: -3 points/day

    // 30-60 days inactive — mild decay
    const mildDecayContacts = await this.prisma.contact.findMany({
      where: {
        lastInteractionAt: { lt: thirtyDaysAgo, gte: sixtyDaysAgo },
        relationshipScore: { gt: 10 },
      },
    });

    for (const contact of mildDecayContacts) {
      await this.prisma.contact.update({
        where: { id: contact.id },
        data: {
          relationshipScore: Math.max(10, contact.relationshipScore - 1),
        },
      });
      decayed++;
    }

    // 60-90 days inactive — moderate decay
    const moderateDecayContacts = await this.prisma.contact.findMany({
      where: {
        lastInteractionAt: { lt: sixtyDaysAgo, gte: ninetyDaysAgo },
        relationshipScore: { gt: 10 },
      },
    });

    for (const contact of moderateDecayContacts) {
      await this.prisma.contact.update({
        where: { id: contact.id },
        data: {
          relationshipScore: Math.max(10, contact.relationshipScore - 2),
        },
      });
      decayed++;
    }

    // 90+ days inactive — aggressive decay
    const aggressiveDecayContacts = await this.prisma.contact.findMany({
      where: {
        lastInteractionAt: { lt: ninetyDaysAgo },
        relationshipScore: { gt: 10 },
      },
    });

    for (const contact of aggressiveDecayContacts) {
      await this.prisma.contact.update({
        where: { id: contact.id },
        data: {
          relationshipScore: Math.max(10, contact.relationshipScore - 3),
        },
      });
      decayed++;
    }

    // Also handle contacts with NO interaction recorded at all
    const neverInteracted = await this.prisma.contact.findMany({
      where: {
        lastInteractionAt: null,
        relationshipScore: { gt: 30 },
        createdAt: { lt: thirtyDaysAgo },
      },
    });

    for (const contact of neverInteracted) {
      await this.prisma.contact.update({
        where: { id: contact.id },
        data: {
          relationshipScore: Math.max(30, contact.relationshipScore - 1),
        },
      });
      decayed++;
    }

    this.logger.log(
      `Relationship score decay complete: ${decayed} contacts updated (${mildDecayContacts.length} mild, ${moderateDecayContacts.length} moderate, ${aggressiveDecayContacts.length} aggressive, ${neverInteracted.length} never-interacted)`,
    );
  }
}
