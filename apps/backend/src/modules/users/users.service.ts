import { Injectable, Logger } from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateUserData {
  email: string;
  passwordHash: string;
  fullName: string;
  role?: Role;
}

export type SafeUser = Omit<User, 'passwordHash'>;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find a user by their unique email address.
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
  }

  /**
   * Find a user by their unique UUID.
   */
  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Create a new user with hashed credentials.
   */
  async create(data: CreateUserData): Promise<User> {
    this.logger.log(`Registering new user with email: ${data.email.toLowerCase().trim()}`);
    return this.prisma.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        passwordHash: data.passwordHash,
        fullName: data.fullName.trim(),
        role: data.role ?? Role.USER,
      },
    });
  }

  /**
   * Helper to strip sensitive fields from user object.
   */
  sanitizeUser(user: User): SafeUser {
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }
}
