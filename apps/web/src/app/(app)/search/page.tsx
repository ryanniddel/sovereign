'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { EmptyState } from '@/components/shared/empty-state';
import { SearchResultItem } from '@/components/search/search-result-item';
import {
  useSearch, useSavedSearches, useCreateSavedSearch, useDeleteSavedSearch,
  useExecuteSavedSearch, useRecentSearches, useRecordSearch, useClearRecentSearches,
} from '@/hooks/use-search';
import {
  SEARCH_ENTITY_TYPE_LABELS, SEARCH_ENTITY_TYPE_ROUTES, SEARCH_ENTITY_TYPES,
  PRIORITY_LABELS,
} from '@/lib/constants';
import type { SearchResult, SearchEntityType, SavedSearch } from '@sovereign/shared';
import { Priority } from '@sovereign/shared';
import {
  Search, Bookmark, BookmarkPlus, Clock, X, Trash2, Star, Loader2,
} from 'lucide-react';

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="space-y-2"><Skeleton className="h-12" /><Skeleton className="h-12" /><Skeleton className="h-12" /></div>}>
      <SearchPageContent />
    </Suspense>
  );
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQ = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQ);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQ);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [grouped, setGrouped] = useState(true);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState('');

  // Debounce search query by 300ms
  useEffect(() => {
    debounceRef.current = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // Update query when URL params change
  useEffect(() => {
    const q = searchParams.get('q');
    if (q && q !== query) { setQuery(q); setDebouncedQuery(q); }
  }, [searchParams]);

  const { data: searchData, isFetching } = useSearch({
    q: debouncedQuery,
    page,
    pageSize,
    entityTypes: entityTypeFilter ? [entityTypeFilter] : undefined,
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
    grouped,
  });
  const { data: savedSearches } = useSavedSearches();
  const { data: recentSearches } = useRecentSearches(10);
  const createSaved = useCreateSavedSearch();
  const deleteSaved = useDeleteSavedSearch();
  const executeSaved = useExecuteSavedSearch();
  const recordSearch = useRecordSearch();
  const clearRecent = useClearRecentSearches();

  const results = searchData?.results || [];
  const groups = searchData?.groups;
  const totalResults = searchData?.totalResults || 0;
  const queryTimeMs = searchData?.queryTimeMs;
  const totalPages = Math.ceil(totalResults / pageSize);

  const handleResultClick = (result: SearchResult) => {
    recordSearch.mutate({
      query,
      resultCount: totalResults,
      selectedResultId: result.id,
      selectedResultType: result.type,
    });
    const base = SEARCH_ENTITY_TYPE_ROUTES[result.type as SearchEntityType] || '/dashboard';
    router.push(`${base}/${result.id}`);
  };

  const handleSaveSearch = () => {
    createSaved.mutate({
      name: saveName,
      query,
      entityTypes: entityTypeFilter ? [entityTypeFilter as SearchEntityType] : undefined,
      filters: {
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(priorityFilter ? { priority: priorityFilter } : {}),
      },
    });
    setSaveDialogOpen(false);
    setSaveName('');
  };

  const handleExecuteSaved = (saved: SavedSearch) => {
    setQuery(saved.query);
    if (saved.entityTypes?.length === 1) {
      setEntityTypeFilter(saved.entityTypes[0]);
    } else {
      setEntityTypeFilter('');
    }
    setPage(1);
  };

  const handleRecentClick = (recentQuery: string) => {
    setQuery(recentQuery);
    setPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Search</h1>
        {queryTimeMs !== undefined && debouncedQuery.length >= 2 && (
          <span className="text-sm text-muted-foreground">
            {totalResults} results in {queryTimeMs}ms
          </span>
        )}
      </div>

      <div className="flex gap-6">
        {/* Main search area */}
        <div className="flex-1 space-y-4">
          {/* Search bar */}
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search contacts, meetings, commitments, action items..."
                className="pl-10 pr-10"
                autoFocus
              />
              {isFetching && (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
            </div>
          </form>

          {/* Filters toolbar */}
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={entityTypeFilter} onValueChange={(v) => { setEntityTypeFilter(v === 'ALL' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                {SEARCH_ENTITY_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{SEARCH_ENTITY_TYPE_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === 'ALL' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Any Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Any Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v === 'ALL' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Any Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Any Priority</SelectItem>
                {Object.entries(PRIORITY_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Switch checked={grouped} onCheckedChange={setGrouped} />
              <Label className="text-sm">Group by type</Label>
            </div>

            {debouncedQuery.length >= 2 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setSaveName(query); setSaveDialogOpen(true); }}
              >
                <BookmarkPlus className="mr-1 h-3 w-3" />Save Search
              </Button>
            )}
          </div>

          {/* Results */}
          {isFetching && debouncedQuery.length >= 2 ? (
            <div className="space-y-2">
              <Skeleton className="h-12" /><Skeleton className="h-12" /><Skeleton className="h-12" />
              <Skeleton className="h-12" /><Skeleton className="h-12" />
            </div>
          ) : query.length < 2 ? (
            <EmptyState
              icon={Search}
              title="Start searching"
              description="Type at least 2 characters to search across all your data"
            />
          ) : results.length === 0 && !groups?.length ? (
            <EmptyState
              icon={Search}
              title="No results found"
              description={`No results matching "${query}". Try adjusting your filters or search terms.`}
            />
          ) : grouped && groups && groups.length > 0 ? (
            <div className="space-y-6">
              {groups.map((group) => (
                <div key={group.type}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      {group.label} ({group.total})
                    </h3>
                  </div>
                  <Card>
                    <CardContent className="p-0">
                      <div className="divide-y">
                        {group.results.map((result) => (
                          <SearchResultItem
                            key={result.id}
                            result={result}
                            onClick={() => handleResultClick(result)}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {results.map((result) => (
                    <SearchResultItem
                      key={result.id}
                      result={result}
                      onClick={() => handleResultClick(result)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {totalPages > 1 && (
            <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </div>

        {/* Sidebar: Saved + Recent searches */}
        <div className="hidden w-72 shrink-0 space-y-4 lg:block">
          {/* Saved searches */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Bookmark className="h-4 w-4" />Saved Searches
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {savedSearches && savedSearches.length > 0 ? (
                savedSearches.map((saved) => (
                  <div key={saved.id} className="flex items-center gap-1">
                    <button
                      className="flex-1 rounded px-2 py-1.5 text-left text-sm hover:bg-accent transition-colors truncate"
                      onClick={() => handleExecuteSaved(saved)}
                    >
                      <span className="font-medium">{saved.name}</span>
                      {saved.shortcutKey && (
                        <kbd className="ml-2 rounded border bg-muted px-1 text-xs">{saved.shortcutKey}</kbd>
                      )}
                      <span className="block text-xs text-muted-foreground truncate">{saved.query}</span>
                    </button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 shrink-0"
                      onClick={() => deleteSaved.mutate(saved.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">No saved searches yet</p>
              )}
            </CardContent>
          </Card>

          {/* Recent searches */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />Recent Searches
                </CardTitle>
                {recentSearches && recentSearches.length > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs"
                    onClick={() => clearRecent.mutate()}
                    disabled={clearRecent.isPending}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              {recentSearches && recentSearches.length > 0 ? (
                recentSearches.map((recent) => (
                  <button
                    key={recent.id}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent transition-colors"
                    onClick={() => handleRecentClick(recent.query)}
                  >
                    <Clock className="h-3 w-3 shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate">{recent.query}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{recent.resultCount}</span>
                  </button>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">No recent searches</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Save search dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Search</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Name</Label>
              <Input value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder="e.g. Overdue commitments" />
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Query: {query}</Label>
              {entityTypeFilter && (
                <Badge variant="outline" className="ml-2 text-xs">
                  {SEARCH_ENTITY_TYPE_LABELS[entityTypeFilter as SearchEntityType]}
                </Badge>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveSearch} disabled={!saveName.trim() || createSaved.isPending}>
              {createSaved.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
