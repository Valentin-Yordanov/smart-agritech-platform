import { ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import type { Response } from 'express';
import { requireSecret } from '../../common/security';
import { SafeUser, UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

const BCRYPT_ROUNDS = 12;

// Compared against when the email is unknown so both login failures take the same time
const DUMMY_HASH = bcrypt.hashSync('timing-equalizer-not-a-real-password', BCRYPT_ROUNDS);

export interface AuthResult {
  user: SafeUser;
  tokens: AuthTokens;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessExpiresIn: string;
  private readonly refreshExpiresIn: string;
  private readonly isProduction: boolean;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.accessSecret = requireSecret(this.configService, 'JWT_ACCESS_SECRET');
    this.refreshSecret = requireSecret(this.configService, 'JWT_REFRESH_SECRET');
    this.accessExpiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '15m');
    this.refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');
    this.isProduction = this.configService.get<string>('NODE_ENV') === 'production';
  }

  /**
   * Hashes plain text password with bcrypt.
   */
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
    return bcrypt.hash(password, salt);
  }

  /**
   * Compares plain password against stored bcrypt hash.
   */
  async comparePasswords(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }

  /**
   * Issues dual-token pair: short-lived Access Token and long-lived Refresh Token.
   */
  async generateTokens(user: { id: string; email: string; role: Role }): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessExpiry = this.accessExpiresIn as JwtSignOptions['expiresIn'];
    const refreshExpiry = this.refreshExpiresIn as JwtSignOptions['expiresIn'];

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.accessSecret,
        expiresIn: accessExpiry,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.refreshSecret,
        expiresIn: refreshExpiry,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Registers a new user, hashes password, and issues tokens.
   */
  async register(dto: RegisterDto): Promise<AuthResult> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('An account with this email already exists.');
    }

    const passwordHash = await this.hashPassword(dto.password);
    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
      fullName: dto.fullName,
      role: Role.USER,
    });

    const tokens = await this.generateTokens(user);
    this.logger.log(`User ${user.id} registered successfully.`);

    return {
      user: this.usersService.sanitizeUser(user),
      tokens,
    };
  }

  /**
   * Authenticates user credentials and issues tokens.
   */
  async login(dto: LoginDto): Promise<AuthResult> {
    // One generic message for unknown email and wrong password prevents account enumeration
    const user = await this.usersService.findByEmail(dto.email);
    const passwordMatches = await this.comparePasswords(dto.password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !passwordMatches) {
      throw new UnauthorizedException('Incorrect email or password. Please try again.');
    }

    const tokens = await this.generateTokens(user);
    this.logger.log(`User ${user.id} logged in successfully.`);

    return {
      user: this.usersService.sanitizeUser(user),
      tokens,
    };
  }

  /**
   * Injects HTTP-only secure cookies into the response object.
   */
  setAuthCookies(res: Response, tokens: AuthTokens): void {
    const isProd = this.isProduction;
    const cookieOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
      path: '/',
    };

    // 15 minutes access token cookie
    res.cookie('access_token', tokens.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });

    // 7 days refresh token cookie
    res.cookie('refresh_token', tokens.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  /**
   * Clears auth cookies upon logout.
   */
  clearAuthCookies(res: Response): void {
    const isProd = this.isProduction;
    const clearOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
      path: '/',
    };

    res.clearCookie('access_token', clearOptions);
    res.clearCookie('refresh_token', clearOptions);
  }
}
