import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { UsersService } from '../users/users.service';
import { SearchQueryDto } from './dto/search-query.dto';
import { wrapPaginatedResponse } from '../common';

@Controller('search')
export class SearchController {
  constructor(
    private readonly searchService: SearchService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  async search(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Query() query: SearchQueryDto,
  ) {
    const user = await this.usersService.findOrCreateFromAuth0(
      currentUser.auth0Id,
      currentUser.email,
    );
    const { results, total } = await this.searchService.search(user.id, query);
    return wrapPaginatedResponse(results, total, query.page, query.pageSize);
  }
}
