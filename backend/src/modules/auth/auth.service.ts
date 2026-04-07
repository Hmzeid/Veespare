import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '@/modules/users/users.service';
import { User, UserRole } from '@/modules/users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './strategies/jwt.strategy';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface AuthResponse {
  user: Partial<User>;
  tokens: TokenPair;
}

@Injectable()
export class AuthService {
  private readonly saltRounds = 12;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const { password, ...userData } = registerDto;

    // Check if email already exists
    const existingEmail = await this.usersService.findByEmail(userData.email);
    if (existingEmail) {
      throw new ConflictException('Email is already registered');
    }

    // Check if phone already exists
    const existingPhone = await this.usersService.findByPhone(userData.phone);
    if (existingPhone) {
      throw new ConflictException('Phone number is already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, this.saltRounds);

    // Create user
    const user = await this.usersService.create({
      ...userData,
      passwordHash,
      role: userData.role || UserRole.CUSTOMER,
      preferredLanguage: userData.preferredLanguage || 'ar',
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, phone, password } = loginDto;

    if (!email && !phone) {
      throw new BadRequestException('Either email or phone must be provided');
    }

    // Find user by email or phone
    let user: User | null;
    if (email) {
      user = await this.usersService.findByEmailWithPassword(email);
    } else {
      user = await this.usersService.findByPhoneWithPassword(phone!);
    }

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.usersService.updateLastLogin(user.id);

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  async validateUser(emailOrPhone: string, password: string): Promise<User | null> {
    let user: User | null;

    // Try email first, then phone
    user = await this.usersService.findByEmailWithPassword(emailOrPhone);
    if (!user) {
      user = await this.usersService.findByPhoneWithPassword(emailOrPhone);
    }

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async refreshToken(refreshToken: string): Promise<TokenPair> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      if (!user.isActive) {
        throw new UnauthorizedException('Account is deactivated');
      }

      return this.generateTokens(user);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);

    // Always return success to prevent email enumeration
    if (!user) {
      return { message: 'If an account with that email exists, a password reset link has been sent' };
    }

    // Generate a short-lived reset token
    const resetToken = await this.jwtService.signAsync(
      { sub: user.id, email: user.email, type: 'reset' },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '15m',
      },
    );

    // TODO: Send reset email via mail service
    // await this.mailService.sendPasswordReset(user.email, resetToken);

    return { message: 'If an account with that email exists, a password reset link has been sent' };
  }

  private async generateTokens(user: User): Promise<TokenPair> {
    const payload: Omit<JwtPayload, 'type'> = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { ...payload, type: 'access' },
        {
          secret: this.configService.get<string>('JWT_SECRET'),
          expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRATION', '15m'),
        },
      ),
      this.jwtService.signAsync(
        { ...payload, type: 'refresh' },
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d'),
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: User): Partial<User> {
    const { passwordHash, ...sanitized } = user as User & { passwordHash?: string };
    return sanitized;
  }
}
