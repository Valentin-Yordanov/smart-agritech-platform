// Only same-site paths: rejects "//evil.com" and "/\evil.com", which browsers treat as other hosts
export function safeCallbackUrl(value: string | null | undefined, fallback = '/dashboard'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return fallback;
  }
  return value;
}
