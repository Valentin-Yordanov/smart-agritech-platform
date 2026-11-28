import { apiFetch } from '@/lib/api';

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export type UploadFolder = 'scans' | 'community' | 'chat';

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const CHAT_DOCUMENT_TYPES = [
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

// Browsers often report CSV as application/vnd.ms-excel and DOCX as an empty type, so the extension decides
const EXTENSION_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  pdf: 'application/pdf',
  txt: 'text/plain',
  csv: 'text/csv',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

export const CHAT_ACCEPT = '.jpg,.jpeg,.png,.webp,.pdf,.txt,.csv,.docx';

export interface PresignedUploadResponse {
  uploadUrl: string;
  fileKey: string;
  publicUrl: string;
}

export type UploadValidation = 'ok' | 'type' | 'size' | 'empty';

export function resolveMimeType(file: File): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  return EXTENSION_TYPES[ext] ?? null;
}

export function isImageType(mime: string): boolean {
  return (IMAGE_TYPES as readonly string[]).includes(mime);
}

export function validateUpload(file: File, allowed: readonly string[]): UploadValidation {
  const mime = resolveMimeType(file);
  if (!mime || !allowed.includes(mime)) return 'type';
  if (file.size === 0) return 'empty';
  if (file.size > MAX_UPLOAD_BYTES) return 'size';
  return 'ok';
}

export class UploadError extends Error {
  constructor(public readonly status: number) {
    super(`Upload failed (${status})`);
    this.name = 'UploadError';
  }
}

function putWithProgress(
  url: string,
  file: File,
  contentType: string,
  onProgress?: (percent: number) => void,
  signal?: AbortSignal
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new UploadError(xhr.status)));
    xhr.onerror = () => reject(new UploadError(0));
    xhr.onabort = () => reject(new DOMException('Upload aborted', 'AbortError'));
    signal?.addEventListener('abort', () => xhr.abort(), { once: true });
    xhr.send(file);
  });
}

/** Presigns an R2 PUT on the backend, then uploads the file straight to storage. */
export async function uploadFile(
  file: File,
  folder: UploadFolder,
  options: { onProgress?: (percent: number) => void; signal?: AbortSignal } = {}
): Promise<PresignedUploadResponse> {
  const mimeType = resolveMimeType(file) ?? file.type;
  const presigned = await apiFetch<PresignedUploadResponse>('/storage/upload-url', {
    method: 'POST',
    body: { filename: file.name, mimeType, folder, size: file.size },
  });
  await putWithProgress(presigned.uploadUrl, file, mimeType, options.onProgress, options.signal);
  options.onProgress?.(100);
  return presigned;
}
