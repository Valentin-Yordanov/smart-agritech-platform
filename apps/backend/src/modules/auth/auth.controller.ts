import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import type { SafeUser } from '../users/users.service';
import { AuthService, AuthTokens } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { AuthenticatedUser } from './interfaces/authenticated-user.interface';

export interface AuthResponse {
  user: SafeUser;
  tokens: AuthTokens;
  message: string;
}

@ApiTags('Auth')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new agronomist / user account',
    description: 'Creates user, hashes password with bcrypt (10 rounds), sets HTTP-only auth cookies, and returns user profile.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User registered successfully with auth session initialized.',
  })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Email address already in use.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Validation failed.' })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const result = await this.authService.register(dto);
    this.authService.setAuthCookies(res, result.tokens);

    return {
      user: result.user,
      tokens: result.tokens,
      message: 'Account created successfully.',
    };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Authenticate user with email and password',
    description: 'Verifies credentials, issues access/refresh tokens, sets HTTP-only auth cookies, and returns user profile.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Authentication successful with cookies delivered.',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid email or password.' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const result = await this.authService.login(dto);
    this.authService.setAuthCookies(res, result.tokens);

    return {
      user: result.user,
      tokens: result.tokens,
      message: 'Authentication successful.',
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Terminate user session and clear auth cookies',
    description: 'Clears access_token and refresh_token HTTP-only cookies.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Session ended successfully.',
  })
  logout(@Res({ passthrough: true }) res: Response): { message: string } {
    this.authService.clearAuthCookies(res);
    return {
      message: 'Logged out successfully.',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get current authenticated user profile',
    description: 'Returns profile details of the user bound to the current JWT session.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Authenticated user profile retrieved successfully.',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid or expired token.' })
  getProfile(@CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
    return user;
  }
}
