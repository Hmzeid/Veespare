import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CarPartsService } from './car-parts.service';
import {
  CreateCarPartDto,
  GetCompatiblePartsDto,
  UpdateCarPartDto,
} from './dto/car-part.dto';

@ApiTags('Car Parts')
@Controller('car-parts')
export class CarPartsController {
  constructor(private readonly carPartsService: CarPartsService) {}

  // ---------------------------------------------------------------------------
  // CRUD - Create & List
  // ---------------------------------------------------------------------------

  @Post()
  @ApiOperation({ summary: 'Create a new car part in the catalog' })
  @ApiBody({ type: CreateCarPartDto })
  @ApiResponse({ status: 201, description: 'Car part created successfully' })
  async create(@Body(new ValidationPipe({ whitelist: true })) dto: CreateCarPartDto) {
    return this.carPartsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all car parts with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'category', required: false, type: String, example: 'filters' })
  @ApiResponse({ status: 200, description: 'Paginated list of car parts' })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('category') category?: string,
  ) {
    return this.carPartsService.findAll(
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
      category,
    );
  }

  // ---------------------------------------------------------------------------
  // Car Compatibility Lookups (for dropdowns)
  // Static routes must be defined BEFORE the :id wildcard route.
  // ---------------------------------------------------------------------------

  @Get('cars/makes')
  @ApiOperation({ summary: 'Get all car makes (for dropdown)' })
  @ApiResponse({ status: 200, description: 'List of car makes', type: [String] })
  async getMakes() {
    return this.carPartsService.getMakes();
  }

  @Get('cars/models')
  @ApiOperation({ summary: 'Get car models by make (for dropdown)' })
  @ApiQuery({ name: 'make', required: true, example: 'Toyota' })
  @ApiResponse({ status: 200, description: 'List of car models', type: [String] })
  async getModels(@Query('make') make: string) {
    return this.carPartsService.getModelsByMake(make);
  }

  @Get('cars/years')
  @ApiOperation({ summary: 'Get available years by make and model (for dropdown)' })
  @ApiQuery({ name: 'make', required: true, example: 'Toyota' })
  @ApiQuery({ name: 'model', required: true, example: 'Corolla' })
  @ApiResponse({ status: 200, description: 'List of years', type: [Number] })
  async getYears(@Query('make') make: string, @Query('model') model: string) {
    return this.carPartsService.getYearsByMakeModel(make, model);
  }

  @Get('cars/details')
  @ApiOperation({ summary: 'Get car compatibility details for a specific car' })
  @ApiQuery({ name: 'make', required: true, example: 'Toyota' })
  @ApiQuery({ name: 'model', required: true, example: 'Corolla' })
  @ApiQuery({ name: 'year', required: true, type: Number, example: 2020 })
  @ApiResponse({ status: 200, description: 'Car compatibility details' })
  async getCarDetails(
    @Query('make') make: string,
    @Query('model') model: string,
    @Query('year') year: number,
  ) {
    return this.carPartsService.getCarDetails(make, model, Number(year));
  }

  @Get('compatible')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Get compatible parts for a specific car' })
  @ApiResponse({ status: 200, description: 'Paginated compatible parts' })
  async getCompatibleParts(@Query() dto: GetCompatiblePartsDto) {
    return this.carPartsService.getCompatibleParts(dto);
  }

  @Get('oem/:oemNumber')
  @ApiOperation({ summary: 'Get a car part by OEM number' })
  @ApiParam({ name: 'oemNumber', example: '04152-YZZA1' })
  @ApiResponse({ status: 200, description: 'Car part found' })
  @ApiResponse({ status: 404, description: 'Car part not found' })
  async findByOem(@Param('oemNumber') oemNumber: string) {
    return this.carPartsService.findByOem(oemNumber);
  }

  // ---------------------------------------------------------------------------
  // CRUD - Single item (wildcard :id must be LAST among GET routes)
  // ---------------------------------------------------------------------------

  @Get(':id')
  @ApiOperation({ summary: 'Get a car part by ID' })
  @ApiParam({ name: 'id', example: '665a1b2c3d4e5f6a7b8c9d0e' })
  @ApiResponse({ status: 200, description: 'Car part found' })
  @ApiResponse({ status: 404, description: 'Car part not found' })
  async findById(@Param('id') id: string) {
    return this.carPartsService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a car part' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: UpdateCarPartDto })
  @ApiResponse({ status: 200, description: 'Car part updated' })
  @ApiResponse({ status: 404, description: 'Car part not found' })
  async update(
    @Param('id') id: string,
    @Body(new ValidationPipe({ whitelist: true })) dto: UpdateCarPartDto,
  ) {
    return this.carPartsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a car part' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 204, description: 'Car part deleted' })
  @ApiResponse({ status: 404, description: 'Car part not found' })
  async remove(@Param('id') id: string) {
    return this.carPartsService.softDelete(id);
  }
}
