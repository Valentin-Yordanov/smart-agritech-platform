import { randomBytes } from 'node:crypto';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const logger = new Logger('Security');
const devFallbacks = new Map<string, string>();

export const isProductionEnv = (): boolean => process.env.NODE_ENV === 'production';

/**
 * Production refuses to boot without a strong secret. Development gets a random per-process
 * value instead of a hardcoded one, so a forgotten env var can never yield forgeable tokens.
 */
export function requireSecret(config: ConfigService, name: string, minLength = 32): string {
  const value = config.get<string>(name);
  if (value && value.length >= minLength) {
    return value;
  }

  if (isProductionEnv()) {
    throw new Error(`${name} must be set to at least ${minLength} characters in production.`);
  }

  if (!devFallbacks.has(name)) {
    logger.warn(`${name} is missing or too short; using a random development-only value.`);
    devFallbacks.set(name, randomBytes(48).toString('base64url'));
  }
  return devFallbacks.get(name)!;
}

export const INTERNAL_KEY_HEADER = 'X-Internal-API-Key';

export function internalAiHeaders(config: ConfigService): Record<string, string> {
  const key = config.get<string>('INTERNAL_API_KEY');
  return key ? { [INTERNAL_KEY_HEADER]: key } : {};
}

// Only keys produced by StorageService.getPresignedUploadUrl are accepted for diagnosis jobs
export const UPLOAD_KEY_PATTERN =
  /^uploads\/(scans|leaves|community)\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-[a-z0-9._-]{1,120}$/;
