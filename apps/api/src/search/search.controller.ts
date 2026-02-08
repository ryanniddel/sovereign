import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { UsersService } from '../users/users.service';
import { SearchQueryDto } from './dto/search-query.dto';
import { CreateSavedSearchDto, UpdateSavedSearchDto } from './dto/saved-search.dto';
import { RecordSearchDto } from './dto/record-search.dto';
import { wrapResponse, wrapPaginatedResponse } from '../common';

@Controller('search')
export class SearchController {
  constructor(
    private readonly searchService: SearchService,
    private readonly usersService: UsersService,
  ) {}

  private async resolveUserId(currentUser: { auth0Id: string; email: string }) {
    const user = await this.usersService.findOrCreateFromAuth0(currentUser.auth0Id, currentUser.email);
    return user.id;
  }

  // ── Universal Search ──

  @Get()
  async search(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Query() query: SearchQueryDto,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const { results, groups, total, queryTimeMs } = await this.searchService.search(userId, query);

    if (query.grouped) {
      return wrapResponse({ groups, total, queryTimeMs });
    }

    return {
      ...wrapPaginatedResponse(results, total, query.page, query.pageSize),
      groups,
      queryTimeMs,
    };
  }

  // ── Quick Search (command palette typeahead) ──

  @Get('quick')
  async quickSearch(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Query('q') q: string,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const results = await this.searchService.quickSearch(userId, q);
    return wrapResponse(results);
  }

  // ── Suggestions (typeahead from recent + saved) ──

  @Get('suggestions')
  async getSuggestions(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Query('q') q: string,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const suggestions = await this.searchService.getSuggestions(userId, q || '');
    return wrapResponse(suggestions);
  }

  // ── Saved Searches ──

  @Get('saved')
  async getSavedSearches(@CurrentUser() currentUser: { auth0Id: string; email: string }) {
    const userId = await this.resolveUserId(currentUser);
    const saved = await this.searchService.getSavedSearches(userId);
    return wrapResponse(saved);
  }

  @Post('saved')
  async createSavedSearch(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Body() dto: CreateSavedSearchDto,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const saved = await this.searchService.createSavedSearch(userId, dto);
    return wrapResponse(saved);
  }

  @Patch('saved/:id')
  async updateSavedSearch(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
    @Body() dto: UpdateSavedSearchDto,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const saved = await this.searchService.updateSavedSearch(userId, id, dto);
    return wrapResponse(saved);
  }

  @Delete('saved/:id')
  async deleteSavedSearch(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
  ) {
    const userId = await this.resolveUserId(currentUser);
    await this.searchService.deleteSavedSearch(userId, id);
    return wrapResponse(null, 'Saved search deleted');
  }

  @Post('saved/:id/execute')
  async executeSavedSearch(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const result = await this.searchService.executeSavedSearch(
      userId,
      id,
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 20,
    );
    return wrapResponse(result);
  }

  // ── Recent Searches ──

  @Get('recent')
  async getRecentSearches(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Query('limit') limit?: string,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const recent = await this.searchService.getRecentSearches(userId, limit ? parseInt(limit, 10) : 10);
    return wrapResponse(recent);
  }

  @Post('recent')
  async recordSearch(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Body() dto: RecordSearchDto,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const entry = await this.searchService.recordSearch(userId, dto);
    return wrapResponse(entry);
  }

  @Delete('recent')
  async clearRecentSearches(@CurrentUser() currentUser: { auth0Id: string; email: string }) {
    const userId = await this.resolveUserId(currentUser);
    const result = await this.searchService.clearRecentSearches(userId);
    return wrapResponse(result);
  }
}
