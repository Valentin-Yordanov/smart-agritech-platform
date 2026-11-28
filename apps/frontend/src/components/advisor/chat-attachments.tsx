'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AlertTriangle, FileText, ImageIcon, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from 'cn';
import { ApiError } from '@/lib/api';
import {
  CHAT_DOCUMENT_TYPES,
  IMAGE_TYPES,
  isImageType,
  resolveMimeType,
  uploadFile,
  validateUpload,
} from '@/lib/upload';
import { useI18n } from '@/i18n/language-provider';
import type { ChatAttachment } from '@/types/api';

export const MAX_CHAT_FILES = 4;
export const MAX_CHAT_IMAGES = 3;
const CHAT_TYPES = [...IMAGE_TYPES, ...CHAT_DOCUMENT_TYPES];

export interface PendingAttachment {
  id: string;
  file: File;
  mime: string;
  kind: 'image' | 'document';
  previewUrl?: string;
  progress: number;
  status: 'uploading' | 'ready' | 'error';
  key?: string;
  controller: AbortController;
}

let pendingCounter = 0;

export function useChatAttachments() {
  const { t } = useI18n();
  const [items, setItems] = useState<PendingAttachment[]>([]);
  const itemsRef = useRef(items);
  useLayoutEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(
    () => () => {
      for (const item of itemsRef.current) {
        item.controller.abort();
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      }
    },
    []
  );

  const patch = useCallback((id: string, update: Partial<PendingAttachment>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...update } : item)));
  }, []);

  const start = useCallback(
    (item: PendingAttachment) => {
      uploadFile(item.file, 'chat', {
        signal: item.controller.signal,
        onProgress: (progress) => patch(item.id, { progress }),
      })
        .then((res) => patch(item.id, { status: 'ready', key: res.fileKey, progress: 100 }))
        .catch((err: unknown) => {
          if (err instanceof DOMException && err.name === 'AbortError') return;
          patch(item.id, { status: 'error' });
          toast.error(err instanceof ApiError ? err.message : t('advisor.err.upload', { name: item.file.name }));
        });
    },
    [patch, t]
  );

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      const current = itemsRef.current;
      let imageCount = current.filter((i) => i.kind === 'image').length;
      const accepted: PendingAttachment[] = [];

      for (const file of Array.from(incoming)) {
        if (current.length + accepted.length >= MAX_CHAT_FILES) {
          toast.error(t('advisor.err.maxFiles'));
          break;
        }
        const check = validateUpload(file, CHAT_TYPES);
        if (check !== 'ok') {
          const key = check === 'type' ? 'advisor.err.fileType' : check === 'size' ? 'advisor.err.fileSize' : 'advisor.err.fileEmpty';
          toast.error(t(key, { name: file.name }));
          continue;
        }
        const mime = resolveMimeType(file)!;
        const kind = isImageType(mime) ? 'image' : 'document';
        if (kind === 'image' && imageCount >= MAX_CHAT_IMAGES) {
          toast.error(t('advisor.err.maxImages'));
          continue;
        }
        if (kind === 'image') imageCount += 1;
        pendingCounter += 1;
        accepted.push({
          id: `att-${pendingCounter}`,
          file,
          mime,
          kind,
          previewUrl: kind === 'image' ? URL.createObjectURL(file) : undefined,
          progress: 0,
          status: 'uploading',
          controller: new AbortController(),
        });
      }

      if (accepted.length === 0) return;
      setItems((prev) => [...prev, ...accepted]);
      accepted.forEach(start);
    },
    [start, t]
  );

  const remove = useCallback((id: string) => {
    const item = itemsRef.current.find((i) => i.id === id);
    if (!item) return;
    item.controller.abort();
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  // Hands the current items to the caller (who owns their preview URLs from now on) and empties the tray
  const take = useCallback(() => {
    const snapshot = itemsRef.current;
    setItems([]);
    return snapshot;
  }, []);

  const restore = useCallback((snapshot: PendingAttachment[]) => setItems(snapshot), []);

  return {
    items,
    addFiles,
    remove,
    take,
    restore,
    uploading: items.some((i) => i.status === 'uploading'),
    hasErrors: items.some((i) => i.status === 'error'),
  };
}

export function releasePreviews(items: PendingAttachment[]) {
  for (const item of items) {
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
  }
}

export function AttachmentChips({
  items,
  onRemove,
  disabled,
}: {
  items: PendingAttachment[];
  onRemove: (id: string) => void;
  disabled?: boolean;
}) {
  const { t } = useI18n();
  if (items.length === 0) return null;

  return (
    <ul className="mb-2 flex flex-wrap gap-2" aria-label={t('advisor.attach')}>
      {items.map((item) => (
        <li
          key={item.id}
          className={cn(
            'relative flex max-w-[220px] items-center gap-2 overflow-hidden rounded-lg border bg-card py-1.5 pr-8 pl-1.5 text-xs',
            item.status === 'error' ? 'border-red-300 bg-red-50' : 'border-border'
          )}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted text-slate-500">
            {item.previewUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-medium text-slate-800">{item.file.name}</span>
            <span className="block text-[11px] text-slate-500">
              {item.status === 'uploading' ? (
                <span className="inline-flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {t('advisor.uploading', { percent: item.progress })}
                </span>
              ) : item.status === 'error' ? (
                <span className="text-red-700">{t('advisor.uploadFailed')}</span>
              ) : (
                `${(item.file.size / 1024 / 1024).toFixed(1)} MB`
              )}
            </span>
          </span>
          {item.status === 'uploading' && (
            <span
              className="absolute bottom-0 left-0 h-0.5 bg-emerald-600 transition-[width]"
              style={{ width: `${item.progress}%` }}
              aria-hidden
            />
          )}
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            disabled={disabled}
            aria-label={t('advisor.removeFile', { name: item.file.name })}
            className="absolute top-1/2 right-1 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-50"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </li>
      ))}
    </ul>
  );
}

export function MessageAttachments({
  attachments,
  isUser,
}: {
  attachments: ChatAttachment[];
  isUser: boolean;
}) {
  const { t } = useI18n();
  const images = attachments.filter((a) => a.kind === 'image');
  const documents = attachments.filter((a) => a.kind === 'document');

  return (
    <div className="mb-2 space-y-2">
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((a) =>
            a.url ? (
              <a
                key={a.key}
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                title={a.summary || a.name}
                className="block h-28 w-28 overflow-hidden rounded-lg border border-white/30 bg-black/5"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.url} alt={a.name} className="h-full w-full object-cover" />
              </a>
            ) : (
              <span
                key={a.key}
                className="flex h-28 w-28 items-center justify-center rounded-lg border border-white/30 bg-black/10"
                title={a.name}
              >
                <ImageIcon className="h-6 w-6 opacity-70" />
              </span>
            )
          )}
        </div>
      )}
      {documents.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {documents.map((a) => {
            const label = (
              <>
                <FileText className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{a.name}</span>
                {a.status === 'unreadable' && (
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" aria-label={t('advisor.unreadable')} />
                )}
              </>
            );
            const className = cn(
              'inline-flex max-w-[240px] items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium',
              isUser ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-card text-slate-700 ring-1 ring-border'
            );
            const title = a.status === 'unreadable' ? `${t('advisor.unreadable')}: ${a.summary}` : a.summary || a.name;
            return a.url ? (
              <a key={a.key} href={a.url} target="_blank" rel="noopener noreferrer" title={title} className={className}>
                {label}
              </a>
            ) : (
              <span key={a.key} title={title} className={className}>
                {label}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
