import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SearchQueryDto } from './dto/search-query.dto';

export interface SearchResult {
  id: string;
  type: string;
  title: string;
  description?: string;
  relevance: number;
}

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(userId: string, query: SearchQueryDto): Promise<{ results: SearchResult[]; total: number }> {
    const searchTerm = query.q.trim();
    const types = query.entityTypes || ['contacts', 'meetings', 'commitments', 'actionItems', 'agreements'];
    const allResults: SearchResult[] = [];

    if (types.includes('contacts')) {
      const contacts = await this.prisma.contact.findMany({
        where: {
          userId,
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { email: { contains: searchTerm, mode: 'insensitive' } },
            { company: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        take: query.pageSize,
      });
      allResults.push(
        ...contacts.map((c) => ({
          id: c.id,
          type: 'contact',
          title: c.name,
          description: `${c.email}${c.company ? ` - ${c.company}` : ''}`,
          relevance: c.name.toLowerCase().includes(searchTerm.toLowerCase()) ? 1 : 0.5,
        })),
      );
    }

    if (types.includes('meetings')) {
      const meetings = await this.prisma.meeting.findMany({
        where: {
          userId,
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
            { purpose: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        take: query.pageSize,
      });
      allResults.push(
        ...meetings.map((m) => ({
          id: m.id,
          type: 'meeting',
          title: m.title,
          description: m.purpose || m.description || undefined,
          relevance: m.title.toLowerCase().includes(searchTerm.toLowerCase()) ? 1 : 0.5,
        })),
      );
    }

    if (types.includes('commitments')) {
      const commitments = await this.prisma.commitment.findMany({
        where: {
          userId,
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        take: query.pageSize,
      });
      allResults.push(
        ...commitments.map((c) => ({
          id: c.id,
          type: 'commitment',
          title: c.title,
          description: c.description || undefined,
          relevance: c.title.toLowerCase().includes(searchTerm.toLowerCase()) ? 1 : 0.5,
        })),
      );
    }

    if (types.includes('actionItems')) {
      const actionItems = await this.prisma.actionItem.findMany({
        where: {
          userId,
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        take: query.pageSize,
      });
      allResults.push(
        ...actionItems.map((a) => ({
          id: a.id,
          type: 'actionItem',
          title: a.title,
          description: a.description || undefined,
          relevance: a.title.toLowerCase().includes(searchTerm.toLowerCase()) ? 1 : 0.5,
        })),
      );
    }

    if (types.includes('agreements')) {
      const agreements = await this.prisma.agreement.findMany({
        where: {
          userId,
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        take: query.pageSize,
      });
      allResults.push(
        ...agreements.map((a) => ({
          id: a.id,
          type: 'agreement',
          title: a.title,
          description: a.description,
          relevance: a.title.toLowerCase().includes(searchTerm.toLowerCase()) ? 1 : 0.5,
        })),
      );
    }

    // Sort by relevance
    allResults.sort((a, b) => b.relevance - a.relevance);

    const start = (query.page - 1) * query.pageSize;
    const paged = allResults.slice(start, start + query.pageSize);

    return { results: paged, total: allResults.length };
  }
}
