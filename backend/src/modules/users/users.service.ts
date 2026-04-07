import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateAddressDto } from './dto/create-address.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  // ─── Finders ──────────────────────────────────────────────

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findByIdWithPassword(id: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.id = :id', { id })
      .getOne();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne();
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { phone } });
  }

  async findByPhoneWithPassword(phone: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.phone = :phone', { phone })
      .getOne();
  }

  // ─── Create / Update ─────────────────────────────────────

  /**
   * Create a new user. Throws ConflictException if email or phone already exist.
   */
  async create(data: Partial<User>): Promise<User> {
    if (data.email) {
      const existingEmail = await this.findByEmail(data.email);
      if (existingEmail) {
        throw new ConflictException('A user with this email already exists');
      }
    }

    if (data.phone) {
      const existingPhone = await this.findByPhone(data.phone);
      if (existingPhone) {
        throw new ConflictException('A user with this phone number already exists');
      }
    }

    const user = this.usersRepository.create(data);
    return this.usersRepository.save(user);
  }

  /**
   * Update user profile fields. Validates phone uniqueness if changed.
   */
  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.phone && dto.phone !== user.phone) {
      const existingPhone = await this.findByPhone(dto.phone);
      if (existingPhone) {
        throw new ConflictException('This phone number is already in use');
      }
    }

    Object.assign(user, dto);
    return this.usersRepository.save(user);
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.usersRepository.update(userId, { lastLoginAt: new Date() });
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await this.usersRepository.update(userId, { passwordHash });
  }

  // ─── Addresses ────────────────────────────────────────────

  /**
   * Add a new address to the user's addresses JSONB array.
   * If isDefault is true, unsets default on all other addresses.
   */
  async addAddress(userId: string, dto: CreateAddressDto): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const addresses = user.addresses ?? [];

    if (dto.isDefault) {
      addresses.forEach((addr) => (addr.isDefault = false));
    }

    // First address is automatically default
    const isDefault = dto.isDefault ?? addresses.length === 0;

    addresses.push({
      id: uuidv4(),
      label: dto.label,
      labelAr: dto.labelAr,
      street: dto.street,
      area: dto.area,
      city: dto.city,
      governorate: dto.governorate,
      postalCode: dto.postalCode,
      lat: dto.lat,
      lng: dto.lng,
      isDefault,
    });

    user.addresses = addresses;
    return this.usersRepository.save(user);
  }

  /**
   * Update an existing address by its id within the JSONB array.
   */
  async updateAddress(
    userId: string,
    addressId: string,
    dto: Partial<CreateAddressDto>,
  ): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const addresses = user.addresses ?? [];
    const index = addresses.findIndex((addr) => addr.id === addressId);
    if (index === -1) {
      throw new NotFoundException('Address not found');
    }

    if (dto.isDefault) {
      addresses.forEach((addr) => (addr.isDefault = false));
    }

    addresses[index] = { ...addresses[index], ...dto };
    user.addresses = addresses;
    return this.usersRepository.save(user);
  }

  /**
   * Remove an address by its id from the JSONB array.
   */
  async removeAddress(userId: string, addressId: string): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const addresses = user.addresses ?? [];
    const filtered = addresses.filter((addr) => addr.id !== addressId);

    if (filtered.length === addresses.length) {
      throw new NotFoundException('Address not found');
    }

    // If the removed address was default and others remain, promote the first
    const wasDefault = addresses.find((a) => a.id === addressId)?.isDefault;
    if (wasDefault && filtered.length > 0) {
      filtered[0].isDefault = true;
    }

    user.addresses = filtered;
    return this.usersRepository.save(user);
  }

  // ─── Cars ─────────────────────────────────────────────────

  /**
   * Get the user's saved cars from the user_cars table.
   */
  async getUserCars(userId: string): Promise<any[]> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const cars = await this.usersRepository.query(
      `SELECT id, make, model, year, engine, vin, plate_number, color,
              nickname, mileage_km, is_primary, created_at, updated_at
       FROM user_cars
       WHERE user_id = $1 AND deleted_at IS NULL
       ORDER BY is_primary DESC, created_at DESC`,
      [userId],
    );

    return cars;
  }

  // ─── Soft Delete ──────────────────────────────────────────

  /**
   * Soft-delete a user by setting deleted_at.
   */
  async softDelete(id: string): Promise<void> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.usersRepository.softRemove(user);
  }
}
