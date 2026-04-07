import {
  Controller,
  Get,
  Patch,
  Delete,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Req,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from './entities/user.entity';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateAddressDto } from './dto/create-address.dto';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ─── Profile ──────────────────────────────────────────────

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Current user profile returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Req() req: any) {
    return this.usersService.findById(req.user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 409, description: 'Phone number already in use' })
  async updateProfile(@Req() req: any, @Body() dto: UpdateUserDto) {
    return this.usersService.update(req.user.id, dto);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete current user account' })
  @ApiResponse({ status: 204, description: 'Account deleted' })
  async deleteProfile(@Req() req: any) {
    await this.usersService.softDelete(req.user.id);
  }

  // ─── Addresses ────────────────────────────────────────────

  @Get('me/addresses')
  @ApiOperation({ summary: 'Get current user addresses' })
  @ApiResponse({ status: 200, description: 'List of addresses returned' })
  async getAddresses(@Req() req: any) {
    const user = await this.usersService.findById(req.user.id);
    return user?.addresses ?? [];
  }

  @Post('me/addresses')
  @ApiOperation({ summary: 'Add a new address' })
  @ApiResponse({ status: 201, description: 'Address added successfully' })
  async addAddress(@Req() req: any, @Body() dto: CreateAddressDto) {
    const user = await this.usersService.addAddress(req.user.id, dto);
    return user.addresses;
  }

  @Patch('me/addresses/:addressId')
  @ApiOperation({ summary: 'Update an existing address' })
  @ApiParam({ name: 'addressId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Address updated' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async updateAddress(
    @Req() req: any,
    @Param('addressId', ParseUUIDPipe) addressId: string,
    @Body() dto: CreateAddressDto,
  ) {
    const user = await this.usersService.updateAddress(
      req.user.id,
      addressId,
      dto,
    );
    return user.addresses;
  }

  @Delete('me/addresses/:addressId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove an address' })
  @ApiParam({ name: 'addressId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Address removed' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async removeAddress(
    @Req() req: any,
    @Param('addressId', ParseUUIDPipe) addressId: string,
  ) {
    await this.usersService.removeAddress(req.user.id, addressId);
  }

  // ─── Cars ─────────────────────────────────────────────────

  @Get('me/cars')
  @ApiOperation({ summary: 'Get current user saved cars' })
  @ApiResponse({ status: 200, description: 'List of user cars' })
  async getMyCars(@Req() req: any) {
    return this.usersService.getUserCars(req.user.id);
  }

  // ─── Admin: lookup by ID ──────────────────────────────────

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get user by ID (admin only)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getUserById(@Param('id', ParseUUIDPipe) id: string) {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  @Get(':id/cars')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get cars for a specific user (admin only)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'User cars returned' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserCars(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.getUserCars(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a user (admin only)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'User deleted' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUser(@Param('id', ParseUUIDPipe) id: string) {
    await this.usersService.softDelete(id);
  }
}
