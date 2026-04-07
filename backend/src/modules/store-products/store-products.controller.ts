import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { StoreProductsService, BulkImportRow } from './store-products.service';
import { CreateStoreProductDto } from './dto/create-store-product.dto';
import { UpdateStoreProductDto } from './dto/update-store-product.dto';
import {
  ProductQueryDto,
  PriceComparisonQueryDto,
  StockAlertQueryDto,
} from './dto/product-query.dto';

// TODO: Replace with actual auth decorator once AuthModule is wired
const TEMP_USER_ID = '00000000-0000-0000-0000-000000000000';

@ApiTags('Store Products')
@ApiBearerAuth()
@Controller('store-products')
export class StoreProductsController {
  constructor(private readonly storeProductsService: StoreProductsService) {}

  // ─── CREATE ────────────────────────────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Create a new store product' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @ApiResponse({ status: 409, description: 'Duplicate product (same store + part + condition)' })
  create(@Body() dto: CreateStoreProductDto) {
    // TODO: extract userId from JWT token via @CurrentUser() decorator
    return this.storeProductsService.create(dto, TEMP_USER_ID);
  }

  // ─── GET BY ID ─────────────────────────────────────────────────────────────

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Product found' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.storeProductsService.findOne(id);
  }

  // ─── UPDATE ────────────────────────────────────────────────────────────────

  @Patch(':id')
  @ApiOperation({ summary: 'Update a product (with automatic price audit logging)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Product updated' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStoreProductDto,
  ) {
    return this.storeProductsService.update(id, dto, TEMP_USER_ID);
  }

  // ─── DELETE ────────────────────────────────────────────────────────────────

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a product' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Product deleted' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.storeProductsService.remove(id, TEMP_USER_ID);
  }

  // ─── LIST BY STORE ─────────────────────────────────────────────────────────

  @Get('store/:storeId')
  @ApiOperation({ summary: 'List products by store with filters, pagination, sorting' })
  @ApiParam({ name: 'storeId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Paginated product list' })
  findByStore(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Query() query: ProductQueryDto,
  ) {
    return this.storeProductsService.findByStore(storeId, query);
  }

  // ─── LIST BY PART ──────────────────────────────────────────────────────────

  @Get('part/:partId')
  @ApiOperation({ summary: 'List all store listings for a specific part' })
  @ApiParam({ name: 'partId', type: 'string', description: 'MongoDB part catalog _id' })
  @ApiResponse({ status: 200, description: 'Paginated product list' })
  findByPart(
    @Param('partId') partId: string,
    @Query() query: ProductQueryDto,
  ) {
    return this.storeProductsService.findByPart(partId, query);
  }

  // ─── PRICE COMPARISON ─────────────────────────────────────────────────────

  @Get('part/:partId/price-comparison')
  @ApiOperation({
    summary: 'Compare prices across stores for a specific part',
    description:
      'Returns all active listings for the given part sorted by price, along with min/max/avg statistics',
  })
  @ApiParam({ name: 'partId', type: 'string', description: 'MongoDB part catalog _id' })
  @ApiResponse({ status: 200, description: 'Price comparison results with statistics' })
  getPriceComparison(
    @Param('partId') partId: string,
    @Query() query: PriceComparisonQueryDto,
  ) {
    return this.storeProductsService.getPriceComparison(partId, query);
  }

  // ─── STOCK ALERTS ──────────────────────────────────────────────────────────

  @Get('store/:storeId/stock-alerts')
  @ApiOperation({
    summary: 'Get products with stock at or below minimum alert level',
  })
  @ApiParam({ name: 'storeId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Products needing restock' })
  getStockAlerts(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Query() query: StockAlertQueryDto,
  ) {
    return this.storeProductsService.getStockAlerts(storeId, query);
  }

  // ─── PRICE AUDIT HISTORY ──────────────────────────────────────────────────

  @Get(':id/price-history')
  @ApiOperation({ summary: 'Get price change history for a product' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'List of price audit log entries' })
  getPriceHistory(@Param('id', ParseUUIDPipe) id: string) {
    return this.storeProductsService.getPriceHistory(id);
  }

  // ─── AI CLASSIFICATION ────────────────────────────────────────────────────

  @Post(':id/classify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Run AI classification on a product',
    description:
      'Sends product data to the AI service for category classification, authenticity scoring, and risk assessment',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Product updated with AI classification results' })
  @ApiResponse({ status: 400, description: 'AI service not configured' })
  classifyWithAi(@Param('id', ParseUUIDPipe) id: string) {
    return this.storeProductsService.classifyWithAi(id, TEMP_USER_ID);
  }

  // ─── VIEW COUNT ────────────────────────────────────────────────────────────

  @Post(':id/view')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Increment product view count' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'View count incremented' })
  incrementView(@Param('id', ParseUUIDPipe) id: string) {
    return this.storeProductsService.incrementViewCount(id);
  }

  // ─── BULK IMPORT (CSV) ────────────────────────────────────────────────────

  @Post('store/:storeId/bulk-import')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (_req, file, cb) => {
        if (!file.originalname.match(/\.csv$/i)) {
          return cb(
            new BadRequestException('Only CSV files are allowed'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Bulk import products from CSV file',
    description:
      'Upload a CSV file with columns: partId, oemNumber, nameEn, nameAr, descriptionEn, descriptionAr, category, brand, price, originalPrice, currency, stock, minStockAlert, condition, images (semicolon-separated URLs), warrantyMonths, weightKg, compatibleCars (JSON). Existing products (matched by partId + condition) will be updated.',
  })
  @ApiParam({ name: 'storeId', type: 'string', format: 'uuid' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'CSV file' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Import results with created/updated counts and errors',
  })
  async bulkImport(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('CSV file is required');
    }

    const rows = this.parseCsv(file.buffer.toString('utf-8'));
    return this.storeProductsService.bulkImport(storeId, rows, TEMP_USER_ID);
  }

  // ─── CSV PARSER ────────────────────────────────────────────────────────────

  private parseCsv(content: string): BulkImportRow[] {
    const lines = content.split('\n').filter((line) => line.trim());
    if (lines.length < 2) {
      throw new BadRequestException('CSV file must have a header row and at least one data row');
    }

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));

    const requiredHeaders = ['partId', 'nameEn', 'nameAr', 'price', 'stock', 'condition'];
    const missing = requiredHeaders.filter((h) => !headers.includes(h));
    if (missing.length > 0) {
      throw new BadRequestException(
        `CSV is missing required columns: ${missing.join(', ')}`,
      );
    }

    return lines.slice(1).map((line) => {
      const values = this.parseCsvLine(line);
      const row: Record<string, any> = {};

      headers.forEach((header, index) => {
        const value = values[index]?.trim().replace(/^"|"$/g, '') ?? '';
        if (value !== '') {
          row[header] = value;
        }
      });

      // Cast numeric fields
      if (row.price) row.price = parseFloat(row.price);
      if (row.originalPrice) row.originalPrice = parseFloat(row.originalPrice);
      if (row.stock) row.stock = parseInt(row.stock, 10);
      if (row.minStockAlert) row.minStockAlert = parseInt(row.minStockAlert, 10);
      if (row.warrantyMonths) row.warrantyMonths = parseInt(row.warrantyMonths, 10);
      if (row.weightKg) row.weightKg = parseFloat(row.weightKg);

      return row as BulkImportRow;
    });
  }

  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  }
}
