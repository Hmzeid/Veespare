import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { StoreStatus } from './entities/store.entity';
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';
import { UserRole } from '@/modules/users/entities/user.entity';

@ApiTags('Stores')
@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  // ── Public endpoints ─────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'List stores with filtering and pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'governorate', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: StoreStatus })
  @ApiQuery({ name: 'isVerified', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Paginated list of stores' })
  async list(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('governorate') governorate?: string,
    @Query('status') status?: StoreStatus,
    @Query('isVerified') isVerified?: boolean,
    @Query('search') search?: string,
  ) {
    return this.storesService.list({
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
      governorate,
      status,
      isVerified,
      search,
    });
  }

  @Get('by-governorate/:governorate')
  @ApiOperation({ summary: 'List active stores by governorate' })
  @ApiParam({ name: 'governorate', type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Stores in the given governorate' })
  async listByGovernorate(
    @Param('governorate') governorate: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.storesService.listByGovernorate(
      governorate,
      page ? +page : undefined,
      limit ? +limit : undefined,
    );
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get a store by its slug' })
  @ApiParam({ name: 'slug', type: String })
  @ApiResponse({ status: 200, description: 'Store details' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  async findBySlug(@Param('slug') slug: string) {
    return this.storesService.findBySlug(slug);
  }

  @Get('my/stores')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.STORE_OWNER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get stores owned by the current user' })
  @ApiResponse({ status: 200, description: 'List of owned stores' })
  async myStores(@Req() req: any) {
    return this.storesService.findByOwner(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a store by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Store details' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.storesService.findOneOrFail(id);
  }

  // ── Authenticated endpoints ──────────────────────────────────────────

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.STORE_OWNER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new store' })
  @ApiResponse({ status: 201, description: 'Store created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - wrong role' })
  async create(@Req() req: any, @Body() dto: CreateStoreDto) {
    return this.storesService.create(req.user.id, dto);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.STORE_OWNER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a store' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Store updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
    @Body() dto: UpdateStoreDto,
  ) {
    const isAdmin = req.user.role === UserRole.ADMIN;
    return this.storesService.update(id, dto, req.user.id, isAdmin);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.STORE_OWNER, UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a store' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 204, description: 'Store deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    const isAdmin = req.user.role === UserRole.ADMIN;
    await this.storesService.remove(id, req.user.id, isAdmin);
  }

  // ── Admin endpoints ──────────────────────────────────────────────────

  @Patch(':id/verify')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify a store (admin only)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Store verified' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  @ApiResponse({ status: 409, description: 'Store already verified' })
  async verify(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.storesService.verifyStore(id, req.user.id);
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update store status (admin only)' })
  @ApiParam({ name: 'id', type: String })
  @ApiQuery({ name: 'status', enum: StoreStatus })
  @ApiResponse({ status: 200, description: 'Store status updated' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('status') status: StoreStatus,
    @Req() req: any,
  ) {
    return this.storesService.updateStatus(id, status, req.user.id);
  }

  @Get(':id/analytics')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.STORE_OWNER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get store analytics' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Store analytics data' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  async getAnalytics(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ) {
    const isAdmin = req.user.role === UserRole.ADMIN;
    return this.storesService.getAnalytics(id, req.user.id, isAdmin);
  }

  @Patch(':id/wallet')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update store wallet balance (admin only)' })
  @ApiParam({ name: 'id', type: String })
  @ApiQuery({ name: 'amount', type: Number })
  @ApiQuery({ name: 'type', enum: ['credit', 'debit'] })
  @ApiResponse({ status: 200, description: 'Wallet balance updated' })
  @ApiResponse({ status: 400, description: 'Insufficient balance for debit' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  async updateWallet(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('amount') amount: number,
    @Query('type') type: 'credit' | 'debit',
  ) {
    return this.storesService.updateWalletBalance(id, +amount, type);
  }
}
