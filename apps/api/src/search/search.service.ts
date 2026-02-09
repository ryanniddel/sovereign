import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '@prisma/client';
import { SearchQueryDto, SEARCH_ENTITY_TYPES } from './dto/search-query.dto';
import { CreateSavedSearchDto, UpdateSavedSearchDto } from './dto/saved-search.dto';
import { RecordSearchDto } from './dto/record-search.dto';

export interface SearchResult {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  description?: string;
  status?: string;
  priority?: string;
  date?: Date;
  relevance: number;
  metadata?: Record<string, unknown>;
}

export interface SearchGroup {
  type: string;
  label: string;
  results: SearchResult[];
  total: number;
}

interface SearchFilters {
  status?: string;
  priority?: string;
  from?: string;
  to?: string;
}

// Priority weights for relevance boosting
const STATUS_BOOST: Record<string, number> = {
  OVERDUE: 0.4,
  IN_PROGRESS: 0.2,
  PENDING: 0.1,
  REQUESTED: 0.1,
  SCHEDULED: 0.05,
};

const PRIORITY_BOOST: Record<string, number> = {
  CRITICAL: 0.3,
  HIGH: 0.2,
  MEDIUM: 0.1,
  LOW: 0,
};

const GROUP_LABELS: Record<string, string> = {
  contact: 'Contacts',
  meeting: 'Meetings',
  commitment: 'Commitments',
  actionItem: 'Action Items',
  agreement: 'Agreements',
  calendarEvent: 'Calendar Events',
  escalationRule: 'Escalation Rules',
  briefing: 'Briefings',
  focusMode: 'Focus Modes',
};

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Universal Search ──

  async search(
    userId: string,
    query: SearchQueryDto,
  ): Promise<{ results: SearchResult[]; groups?: SearchGroup[]; total: number; queryTimeMs: number }> {
    const startTime = Date.now();
    const searchTerm = query.q.trim();
    const lowerTerm = searchTerm.toLowerCase();
    const types = query.entityTypes || [...SEARCH_ENTITY_TYPES];
    const limit = query.pageSize;
    const filters: SearchFilters = {
      status: query.status,
      priority: query.priority,
      from: query.from,
      to: query.to,
    };

    // Run all entity searches in parallel for <375ms target
    const searchPromises: Promise<SearchResult[]>[] = [];
    const typeOrder: string[] = [];

    if (types.includes('contacts')) {
      typeOrder.push('contact');
      searchPromises.push(this.searchContacts(userId, searchTerm, lowerTerm, limit));
    }
    if (types.includes('meetings')) {
      typeOrder.push('meeting');
      searchPromises.push(this.searchMeetings(userId, searchTerm, lowerTerm, limit, filters));
    }
    if (types.includes('commitments')) {
      typeOrder.push('commitment');
      searchPromises.push(this.searchCommitments(userId, searchTerm, lowerTerm, limit, filters));
    }
    if (types.includes('actionItems')) {
      typeOrder.push('actionItem');
      searchPromises.push(this.searchActionItems(userId, searchTerm, lowerTerm, limit, filters));
    }
    if (types.includes('agreements')) {
      typeOrder.push('agreement');
      searchPromises.push(this.searchAgreements(userId, searchTerm, lowerTerm, limit));
    }
    if (types.includes('calendarEvents')) {
      typeOrder.push('calendarEvent');
      searchPromises.push(this.searchCalendarEvents(userId, searchTerm, lowerTerm, limit, filters));
    }
    if (types.includes('escalationRules')) {
      typeOrder.push('escalationRule');
      searchPromises.push(this.searchEscalationRules(userId, searchTerm, lowerTerm, limit));
    }
    if (types.includes('briefings')) {
      typeOrder.push('briefing');
      searchPromises.push(this.searchBriefings(userId, searchTerm, lowerTerm, limit));
    }
    if (types.includes('focusModes')) {
      typeOrder.push('focusMode');
      searchPromises.push(this.searchFocusModes(userId, searchTerm, lowerTerm, limit));
    }

    // Use allSettled for graceful degradation — partial results if one entity fails
    const settledResults = await Promise.allSettled(searchPromises);

    // Build grouped results
    const groups: SearchGroup[] = [];
    const allResults: SearchResult[] = [];

    for (let i = 0; i < typeOrder.length; i++) {
      const type = typeOrder[i];
      const settled = settledResults[i];

      if (settled.status === 'rejected') {
        this.logger.warn(`Search for ${type} failed: ${settled.reason}`);
        continue;
      }

      const results = settled.value;
      if (results.length > 0) {
        groups.push({
          type,
          label: GROUP_LABELS[type] || type,
          results: results.slice(0, 5), // Top 5 per group for grouped view
          total: results.length,
        });
      }
      allResults.push(...results);
    }

    // Sort all results by relevance (descending)
    allResults.sort((a, b) => b.relevance - a.relevance);

    const queryTimeMs = Date.now() - startTime;

    if (query.grouped) {
      return { results: [], groups, total: allResults.length, queryTimeMs };
    }

    // Paginate flat results
    const start = (query.page - 1) * query.pageSize;
    const paged = allResults.slice(start, start + query.pageSize);

    return { results: paged, groups, total: allResults.length, queryTimeMs };
  }

  // ── Quick Search (minimal, fast — for command palette typeahead) ──

  async quickSearch(userId: string, q: string): Promise<SearchResult[]> {
    const searchTerm = q.trim();
    if (!searchTerm || searchTerm.length < 2) return [];

    const lowerTerm = searchTerm.toLowerCase();
    const limit = 8;

    // Search only the most common entities in parallel
    const settled = await Promise.allSettled([
      this.searchContacts(userId, searchTerm, lowerTerm, 3),
      this.searchMeetings(userId, searchTerm, lowerTerm, 3, {}),
      this.searchCommitments(userId, searchTerm, lowerTerm, 3, {}),
      this.searchActionItems(userId, searchTerm, lowerTerm, 3, {}),
    ]);

    const results: SearchResult[] = [];
    for (const s of settled) {
      if (s.status === 'fulfilled') results.push(...s.value);
    }

    results.sort((a, b) => b.relevance - a.relevance);
    return results.slice(0, limit);
  }

  // ── Entity Search Methods ──

  private async searchContacts(
    userId: string,
    searchTerm: string,
    lowerTerm: string,
    limit: number,
  ): Promise<SearchResult[]> {
    const contacts = await this.prisma.contact.findMany({
      where: {
        userId,
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { company: { contains: searchTerm, mode: 'insensitive' } },
          { title: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      include: { tier: { select: { name: true, priority: true } } },
      take: limit,
      orderBy: { lastInteractionAt: 'desc' },
    });

    return contacts.map((c) => ({
      id: c.id,
      type: 'contact' as const,
      title: c.name,
      subtitle: c.email,
      description: [c.company, c.title].filter(Boolean).join(' - ') || undefined,
      relevance: this.calculateRelevance(c.name, lowerTerm, {
        recencyDate: c.lastInteractionAt,
        tierPriority: c.tier?.priority,
        relationshipScore: c.relationshipScore,
      }),
      metadata: {
        company: c.company,
        tier: c.tier?.name,
        relationshipScore: c.relationshipScore,
        phone: c.phone,
      },
    }));
  }

  private async searchMeetings(
    userId: string,
    searchTerm: string,
    lowerTerm: string,
    limit: number,
    filters: SearchFilters,
  ): Promise<SearchResult[]> {
    const where: Prisma.MeetingWhereInput = {
      userId,
      OR: [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { purpose: { contains: searchTerm, mode: 'insensitive' } },
        { decisionRequired: { contains: searchTerm, mode: 'insensitive' } },
      ],
    };
    if (filters.status) where.status = filters.status as any;
    if (filters.from) where.scheduledStartTime = { ...(where.scheduledStartTime as any || {}), gte: new Date(filters.from) };
    if (filters.to) where.scheduledStartTime = { ...(where.scheduledStartTime as any || {}), lte: new Date(filters.to) };

    const meetings = await this.prisma.meeting.findMany({
      where,
      include: { _count: { select: { participants: true, commitments: true } } },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return meetings.map((m) => ({
      id: m.id,
      type: 'meeting' as const,
      title: m.title,
      subtitle: m.meetingType || undefined,
      description: m.purpose || m.description || undefined,
      status: m.status,
      date: m.scheduledStartTime || m.createdAt,
      relevance: this.calculateRelevance(m.title, lowerTerm, {
        statusBoost: STATUS_BOOST[m.status] || 0,
        recencyDate: m.scheduledStartTime || m.createdAt,
      }),
      metadata: {
        meetingType: m.meetingType,
        status: m.status,
        scheduledStartTime: m.scheduledStartTime,
        meetingCost: m.meetingCost,
        participantCount: m._count.participants,
        commitmentCount: m._count.commitments,
        rating: m.rating,
      },
    }));
  }

  private async searchCommitments(
    userId: string,
    searchTerm: string,
    lowerTerm: string,
    limit: number,
    filters: SearchFilters,
  ): Promise<SearchResult[]> {
    const where: Prisma.CommitmentWhereInput = {
      userId,
      OR: [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ],
    };
    if (filters.status) where.status = filters.status as any;
    if (filters.priority) where.priority = filters.priority as any;

    const commitments = await this.prisma.commitment.findMany({
      where,
      include: { meeting: { select: { title: true } } },
      take: limit,
      orderBy: [{ dueDate: 'asc' }],
    });

    return commitments.map((c) => ({
      id: c.id,
      type: 'commitment' as const,
      title: c.title,
      subtitle: c.meeting?.title ? `From: ${c.meeting.title}` : undefined,
      description: c.description || undefined,
      status: c.status,
      priority: c.priority,
      date: c.dueDate,
      relevance: this.calculateRelevance(c.title, lowerTerm, {
        statusBoost: STATUS_BOOST[c.status] || 0,
        priorityBoost: PRIORITY_BOOST[c.priority] || 0,
        recencyDate: c.dueDate,
        isOverdue: c.status === 'OVERDUE',
      }),
      metadata: {
        status: c.status,
        priority: c.priority,
        dueDate: c.dueDate,
        ownerType: c.ownerType,
        isDelegated: c.isDelegated,
        escalationLevel: c.currentEscalationLevel,
        meetingTitle: c.meeting?.title,
      },
    }));
  }

  private async searchActionItems(
    userId: string,
    searchTerm: string,
    lowerTerm: string,
    limit: number,
    filters: SearchFilters,
  ): Promise<SearchResult[]> {
    const where: Prisma.ActionItemWhereInput = {
      userId,
      OR: [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ],
    };
    if (filters.status) where.status = filters.status as any;
    if (filters.priority) where.priority = filters.priority as any;

    const items = await this.prisma.actionItem.findMany({
      where,
      include: { meeting: { select: { title: true } } },
      take: limit,
      orderBy: [{ dueDate: 'asc' }],
    });

    return items.map((a) => ({
      id: a.id,
      type: 'actionItem' as const,
      title: a.title,
      subtitle: a.meeting?.title ? `From: ${a.meeting.title}` : undefined,
      description: a.description || undefined,
      status: a.status,
      priority: a.priority,
      date: a.dueDate,
      relevance: this.calculateRelevance(a.title, lowerTerm, {
        statusBoost: STATUS_BOOST[a.status] || 0,
        priorityBoost: PRIORITY_BOOST[a.priority] || 0,
        recencyDate: a.dueDate,
        isOverdue: a.status === 'OVERDUE',
      }),
      metadata: {
        status: a.status,
        priority: a.priority,
        dueDate: a.dueDate,
        ownerType: a.ownerType,
        externalSystem: a.externalSystem,
        meetingTitle: a.meeting?.title,
      },
    }));
  }

  private async searchAgreements(
    userId: string,
    searchTerm: string,
    lowerTerm: string,
    limit: number,
  ): Promise<SearchResult[]> {
    const agreements = await this.prisma.agreement.findMany({
      where: {
        userId,
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      include: { meeting: { select: { title: true } } },
      take: limit,
      orderBy: { agreedAt: 'desc' },
    });

    return agreements.map((a) => ({
      id: a.id,
      type: 'agreement' as const,
      title: a.title,
      subtitle: a.meeting?.title ? `From: ${a.meeting.title}` : undefined,
      description: a.description,
      status: a.isActive ? 'ACTIVE' : 'SUPERSEDED',
      date: a.agreedAt,
      relevance: this.calculateRelevance(a.title, lowerTerm, {
        activeBoost: a.isActive ? 0.2 : 0,
        recencyDate: a.agreedAt,
      }),
      metadata: {
        isActive: a.isActive,
        parties: a.parties,
        agreedAt: a.agreedAt,
        addedToKnowledgeBase: a.addedToKnowledgeBase,
        meetingTitle: a.meeting?.title,
      },
    }));
  }

  private async searchCalendarEvents(
    userId: string,
    searchTerm: string,
    lowerTerm: string,
    limit: number,
    filters: SearchFilters,
  ): Promise<SearchResult[]> {
    const where: Prisma.CalendarEventWhereInput = {
      userId,
      OR: [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { location: { contains: searchTerm, mode: 'insensitive' } },
      ],
    };
    if (filters.from) where.startTime = { ...(where.startTime as any || {}), gte: new Date(filters.from) };
    if (filters.to) where.startTime = { ...(where.startTime as any || {}), lte: new Date(filters.to) };

    const events = await this.prisma.calendarEvent.findMany({
      where,
      take: limit,
      orderBy: { startTime: 'desc' },
    });

    return events.map((e) => ({
      id: e.id,
      type: 'calendarEvent' as const,
      title: e.title,
      subtitle: e.eventType,
      description: e.location || e.description || undefined,
      date: e.startTime,
      relevance: this.calculateRelevance(e.title, lowerTerm, {
        recencyDate: e.startTime,
        isFuture: e.startTime > new Date(),
      }),
      metadata: {
        eventType: e.eventType,
        startTime: e.startTime,
        endTime: e.endTime,
        location: e.location,
        isProtected: e.isProtected,
        isAllDay: e.isAllDay,
        source: e.source,
        meetingId: e.meetingId,
      },
    }));
  }

  private async searchEscalationRules(
    userId: string,
    searchTerm: string,
    lowerTerm: string,
    limit: number,
  ): Promise<SearchResult[]> {
    const rules = await this.prisma.escalationRule.findMany({
      where: {
        userId,
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      include: { _count: { select: { escalationLogs: true } } },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return rules.map((r) => ({
      id: r.id,
      type: 'escalationRule' as const,
      title: r.name,
      subtitle: r.triggerType,
      description: r.description || undefined,
      status: r.isActive ? 'ACTIVE' : 'INACTIVE',
      relevance: this.calculateRelevance(r.name, lowerTerm, {
        activeBoost: r.isActive ? 0.15 : 0,
      }),
      metadata: {
        triggerType: r.triggerType,
        isActive: r.isActive,
        maxRetries: r.maxRetries,
        logCount: r._count.escalationLogs,
      },
    }));
  }

  private async searchBriefings(
    userId: string,
    searchTerm: string,
    lowerTerm: string,
    limit: number,
  ): Promise<SearchResult[]> {
    // Build filter for briefings — match type labels, date patterns, or general text
    const typeFilter: Prisma.BriefingWhereInput[] = [];
    const upperTerm = searchTerm.toUpperCase();

    // Match type labels: "morning", "nightly", "briefing", "review"
    if ('MORNING'.includes(upperTerm) || 'MORNING BRIEFING'.toLowerCase().includes(lowerTerm)) {
      typeFilter.push({ type: 'MORNING' });
    }
    if ('NIGHTLY'.includes(upperTerm) || 'NIGHTLY REVIEW'.toLowerCase().includes(lowerTerm)) {
      typeFilter.push({ type: 'NIGHTLY' });
    }

    // If term matches a date pattern (e.g. "2026-02-08" or "Feb"), search by date
    const dateMatch = searchTerm.match(/^(\d{4}-\d{2}-\d{2})$/);
    if (dateMatch) {
      const searchDate = new Date(dateMatch[1]);
      if (!isNaN(searchDate.getTime())) {
        const nextDay = new Date(searchDate.getTime() + 24 * 60 * 60 * 1000);
        typeFilter.push({ date: { gte: searchDate, lt: nextDay } });
      }
    }

    // If no specific filter matched, search broadly by both types (shows recent briefings)
    if (typeFilter.length === 0 && 'briefing'.includes(lowerTerm)) {
      typeFilter.push({ type: 'MORNING' });
      typeFilter.push({ type: 'NIGHTLY' });
    }

    // Still no match — return empty (briefing content is JSON, not text-searchable)
    if (typeFilter.length === 0) return [];

    const briefings = await this.prisma.briefing.findMany({
      where: {
        userId,
        OR: typeFilter,
      },
      take: limit,
      orderBy: { date: 'desc' },
    });

    return briefings.map((b) => ({
      id: b.id,
      type: 'briefing' as const,
      title: `${b.type === 'MORNING' ? 'Morning Briefing' : 'Nightly Review'} — ${b.date.toISOString().split('T')[0]}`,
      subtitle: b.type,
      status: b.isCompleted ? 'COMPLETED' : b.readAt ? 'READ' : 'UNREAD',
      date: b.date,
      relevance: this.calculateRelevance(
        b.type === 'MORNING' ? 'Morning Briefing' : 'Nightly Review',
        lowerTerm,
        { recencyDate: b.date },
      ),
      metadata: {
        type: b.type,
        date: b.date,
        isCompleted: b.isCompleted,
        readAt: b.readAt,
        feedbackRating: b.feedbackRating,
        deliveryChannel: b.deliveryChannel,
      },
    }));
  }

  private async searchFocusModes(
    userId: string,
    searchTerm: string,
    lowerTerm: string,
    limit: number,
  ): Promise<SearchResult[]> {
    const modes = await this.prisma.focusMode.findMany({
      where: {
        userId,
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: { name: 'asc' },
    });

    return modes.map((m) => ({
      id: m.id,
      type: 'focusMode' as const,
      title: m.name,
      subtitle: m.triggerType,
      description: m.description || undefined,
      status: m.isActive ? 'ACTIVE' : 'INACTIVE',
      relevance: this.calculateRelevance(m.name, lowerTerm, {
        activeBoost: m.isActive ? 0.3 : 0,
      }),
      metadata: {
        isActive: m.isActive,
        triggerType: m.triggerType,
        allowCriticalOnly: m.allowCriticalOnly,
        allowMeetingPrep: m.allowMeetingPrep,
        allowAll: m.allowAll,
        color: m.color,
        icon: m.icon,
        totalActivationMinutes: m.totalActivationMinutes,
      },
    }));
  }

  // ── Relevance Scoring ──

  private calculateRelevance(
    title: string,
    lowerTerm: string,
    boosts: {
      statusBoost?: number;
      priorityBoost?: number;
      activeBoost?: number;
      recencyDate?: Date | null;
      tierPriority?: number;
      relationshipScore?: number;
      isOverdue?: boolean;
      isFuture?: boolean;
    } = {},
  ): number {
    let score = 0;

    // Base text match scoring
    const lowerTitle = title.toLowerCase();
    if (lowerTitle === lowerTerm) {
      score = 1.0; // Exact match
    } else if (lowerTitle.startsWith(lowerTerm)) {
      score = 0.9; // Prefix match
    } else if (lowerTitle.includes(lowerTerm)) {
      score = 0.7; // Contains in title
    } else {
      score = 0.4; // Contains in other fields
    }

    // Status boost (overdue items are more urgent)
    if (boosts.isOverdue) score += 0.5;
    if (boosts.statusBoost) score += boosts.statusBoost;

    // Priority boost
    if (boosts.priorityBoost) score += boosts.priorityBoost;

    // Active entity boost
    if (boosts.activeBoost) score += boosts.activeBoost;

    // Recency boost (items from last 7 days get a boost)
    if (boosts.recencyDate) {
      const daysSince = (Date.now() - boosts.recencyDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince <= 1) score += 0.3;
      else if (daysSince <= 7) score += 0.2;
      else if (daysSince <= 30) score += 0.1;
    }

    // Future event boost (upcoming events are relevant)
    if (boosts.isFuture) score += 0.15;

    // Relationship score boost (higher relationship = more relevant contact)
    if (boosts.relationshipScore !== undefined) {
      score += (boosts.relationshipScore / 100) * 0.2;
    }

    // Tier priority boost
    if (boosts.tierPriority !== undefined) {
      score += Math.min(boosts.tierPriority * 0.05, 0.2);
    }

    return Math.round(score * 1000) / 1000; // 3 decimal places
  }

  // ── Saved Searches ──

  async getSavedSearches(userId: string) {
    return this.prisma.savedSearch.findMany({
      where: { userId },
      orderBy: [{ useCount: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async createSavedSearch(userId: string, dto: CreateSavedSearchDto) {
    return this.prisma.savedSearch.create({
      data: {
        userId,
        name: dto.name,
        query: dto.query,
        entityTypes: dto.entityTypes || Prisma.JsonNull,
        filters: (dto.filters as any) || Prisma.JsonNull,
        shortcutKey: dto.shortcutKey,
      },
    });
  }

  async updateSavedSearch(userId: string, id: string, dto: UpdateSavedSearchDto) {
    const saved = await this.prisma.savedSearch.findFirst({ where: { id, userId } });
    if (!saved) throw new NotFoundException('Saved search not found');

    const data: Record<string, any> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.query !== undefined) data.query = dto.query;
    if (dto.entityTypes !== undefined) data.entityTypes = dto.entityTypes;
    if (dto.filters !== undefined) data.filters = dto.filters;
    if (dto.shortcutKey !== undefined) data.shortcutKey = dto.shortcutKey;

    return this.prisma.savedSearch.update({ where: { id }, data });
  }

  async deleteSavedSearch(userId: string, id: string) {
    const saved = await this.prisma.savedSearch.findFirst({ where: { id, userId } });
    if (!saved) throw new NotFoundException('Saved search not found');
    return this.prisma.savedSearch.delete({ where: { id } });
  }

  async executeSavedSearch(userId: string, id: string, page: number = 1, pageSize: number = 20) {
    const saved = await this.prisma.savedSearch.findFirst({ where: { id, userId } });
    if (!saved) throw new NotFoundException('Saved search not found');

    // Increment use count
    await this.prisma.savedSearch.update({
      where: { id },
      data: { useCount: { increment: 1 }, lastUsedAt: new Date() },
    });

    const query: SearchQueryDto = {
      q: saved.query,
      entityTypes: (saved.entityTypes as string[]) || undefined,
      page,
      pageSize,
      grouped: true,
      ...(saved.filters as any || {}),
    };

    return this.search(userId, query);
  }

  // ── Recent Searches ──

  async getRecentSearches(userId: string, limit: number = 10) {
    return this.prisma.recentSearch.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async recordSearch(userId: string, dto: RecordSearchDto) {
    // De-duplicate: if the same query was searched recently, update it
    const recent = await this.prisma.recentSearch.findFirst({
      where: {
        userId,
        query: dto.query,
        createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) }, // Within last 5 min
      },
    });

    if (recent) {
      return this.prisma.recentSearch.update({
        where: { id: recent.id },
        data: {
          resultCount: dto.resultCount,
          selectedResultId: dto.selectedResultId || recent.selectedResultId,
          selectedResultType: dto.selectedResultType || recent.selectedResultType,
        },
      });
    }

    // Create new recent search
    const entry = await this.prisma.recentSearch.create({
      data: {
        userId,
        query: dto.query,
        entityTypes: dto.entityTypes || Prisma.JsonNull,
        resultCount: dto.resultCount,
        selectedResultId: dto.selectedResultId,
        selectedResultType: dto.selectedResultType,
      },
    });

    // Keep only last 50 recent searches per user
    const count = await this.prisma.recentSearch.count({ where: { userId } });
    if (count > 50) {
      const oldest = await this.prisma.recentSearch.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
        take: count - 50,
        select: { id: true },
      });
      await this.prisma.recentSearch.deleteMany({
        where: { id: { in: oldest.map((o) => o.id) } },
      });
    }

    return entry;
  }

  async clearRecentSearches(userId: string) {
    const result = await this.prisma.recentSearch.deleteMany({ where: { userId } });
    return { deleted: result.count };
  }

  // ── Search Suggestions (from recent + saved) ──

  async getSuggestions(userId: string, partial: string) {
    const lowerPartial = partial.toLowerCase();

    const [recentSearches, savedSearches] = await Promise.all([
      this.prisma.recentSearch.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.savedSearch.findMany({
        where: { userId },
        orderBy: { useCount: 'desc' },
        take: 10,
      }),
    ]);

    // Filter by partial match
    const recentSuggestions = recentSearches
      .filter((r) => r.query.toLowerCase().includes(lowerPartial))
      .slice(0, 5)
      .map((r) => ({
        type: 'recent' as const,
        query: r.query,
        resultCount: r.resultCount,
      }));

    const savedSuggestions = savedSearches
      .filter((s) => s.name.toLowerCase().includes(lowerPartial) || s.query.toLowerCase().includes(lowerPartial))
      .slice(0, 3)
      .map((s) => ({
        type: 'saved' as const,
        id: s.id,
        name: s.name,
        query: s.query,
        shortcutKey: s.shortcutKey,
      }));

    return { recent: recentSuggestions, saved: savedSuggestions };
  }
}
