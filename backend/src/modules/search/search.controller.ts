import { Controller, Get, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SearchService, SearchResult } from './search.service';
import { AutocompleteQueryDto, SearchQueryDto } from './dto/search-query.dto';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({
    summary: 'Search products, parts, or stores',
    description:
      'Full-text search with Arabic text normalization, car compatibility filtering, price range, and sorting.',
  })
  @ApiResponse({ status: 200, description: 'Search results with pagination' })
  async search(@Query() dto: SearchQueryDto): Promise<SearchResult> {
    return this.searchService.search(dto);
  }

  @Get('products')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Search products (store listings)' })
  @ApiResponse({ status: 200, description: 'Product search results' })
  async searchProducts(@Query() dto: SearchQueryDto): Promise<SearchResult> {
    return this.searchService.searchProducts(dto);
  }

  @Get('parts')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Search car parts catalog' })
  @ApiResponse({ status: 200, description: 'Car parts search results' })
  async searchParts(@Query() dto: SearchQueryDto): Promise<SearchResult> {
    return this.searchService.searchParts(dto);
  }

  @Get('stores')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Search stores' })
  @ApiResponse({ status: 200, description: 'Store search results' })
  async searchStores(@Query() dto: SearchQueryDto): Promise<SearchResult> {
    return this.searchService.searchStores(dto);
  }

  @Get('autocomplete')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({
    summary: 'Autocomplete suggestions',
    description: 'Returns part name and OEM number suggestions for a partial query.',
  })
  @ApiResponse({ status: 200, description: 'Autocomplete suggestions' })
  async autocomplete(@Query() dto: AutocompleteQueryDto): Promise<{ suggestions: any[] }> {
    return this.searchService.autocomplete(dto);
  }
}
