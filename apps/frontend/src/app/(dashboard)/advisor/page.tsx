'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Bot,
  Plus,
  Trash2,
  Send,
  Loader2,
  MessageSquareText,
  Sparkles,
  BookOpen,
  X,
  PanelLeftOpen,
  PanelLeftClose,
  Sprout,
  ShieldCheck,
  AlertTriangle,
  Paperclip,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from 'cn';
import { apiFetch, ApiError } from '@/lib/api';
import {
  ChatMessage,
  ChatThread,
  Diagnosis,
  SendMessageResponse,
} from '@/types/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useI18n } from '@/i18n/language-provider';
import type { MessageKey } from '@/i18n/messages';
import { CHAT_ACCEPT } from '@/lib/upload';
import {
  AttachmentChips,
  MessageAttachments,
  releasePreviews,
  useChatAttachments,
} from '@/components/advisor/chat-attachments';

const QUICK_PROMPT_KEYS: MessageKey[] = ['advisor.q1', 'advisor.q2', 'advisor.q3'];

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  return Array.from(new Map(items.map((item) => [item.id, item])).values());
}

interface BackendDiagnosisResponse {
  id: string;
  imageUrl: string;
  speciesName?: string | null;
  species?: string | null;
  diseaseName?: string | null;
  disease?: string | null;
  confidence: number | null;
  isHealthy: boolean | null;
  status: Diagnosis['status'];
  createdAt: string;
  updatedAt?: string;
}

function AdvisorChatContent() {
  const { t, lang, crop, condition } = useI18n();
  const searchParams = useSearchParams();
  const initialDiagnosisId = searchParams.get('diagnosisId');

  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(true);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sourcesByMessageId, setSourcesByMessageId] = useState<
    Record<string, string[]>
  >({});

  const [activeDiagnosisId, setActiveDiagnosisId] = useState<string | null>(
    initialDiagnosisId
  );
  const [diagnosisContext, setDiagnosisContext] = useState<Diagnosis | null>(
    null
  );

  const [prompt, setPrompt] = useState(() => searchParams.get('q') ?? '');
  const [sending, setSending] = useState(false);
  const [creatingThread, setCreatingThread] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sendingFiles, setSendingFiles] = useState(false);
  const [dragging, setDragging] = useState(false);
  const attachments = useChatAttachments();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const tempCounterRef = useRef(0);
  const skipNextLoadThreadIdRef = useRef<string | null>(null);

  // Hydrate user's chat threads on mount
  useEffect(() => {
    let active = true;
    const loadThreads = async () => {
      try {
        const data = await apiFetch<ChatThread[]>('/chat/threads');
        if (active) {
          setThreads(dedupeById(data));
        }
      } catch (err) {
        if (active) {
          const msg =
            err instanceof ApiError ? err.message : t('advisor.err.threads');
          toast.error(msg);
        }
      } finally {
        if (active) {
          setThreadsLoading(false);
        }
      }
    };
    void loadThreads();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hydrate diagnosis context if ?diagnosisId= is present
  useEffect(() => {
    if (!activeDiagnosisId) {
      return;
    }
    let active = true;
    const loadDiagnosis = async () => {
      try {
        const res = await apiFetch<BackendDiagnosisResponse>(
          `/diagnoses/${activeDiagnosisId}`
        );
        if (active) {
          setDiagnosisContext({
            id: res.id,
            userId: '',
            status: res.status,
            imageUrl: res.imageUrl,
            speciesName: res.speciesName ?? res.species ?? t('scan.unknownSpecies'),
            diseaseName: res.diseaseName ?? res.disease ?? t('scan.unknownCondition'),
            confidence: res.confidence ?? 0,
            isHealthy: res.isHealthy ?? false,
            rawDetections: null,
            latitude: null,
            longitude: null,
            createdAt: res.createdAt,
            updatedAt: res.updatedAt ?? res.createdAt,
          });
        }
      } catch {
        if (active) {
          toast.error(t('advisor.err.context'));
          setDiagnosisContext(null);
        }
      }
    };
    void loadDiagnosis();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDiagnosisId]);

  // Load messages whenever activeThreadId changes
  useEffect(() => {
    if (!activeThreadId) {
      return;
    }
    if (skipNextLoadThreadIdRef.current === activeThreadId) {
      skipNextLoadThreadIdRef.current = null;
      return;
    }
    let active = true;
    const loadMessages = async () => {
      setMessagesLoading(true);
      try {
        const detail = await apiFetch<ChatThread>(
          `/chat/threads/${activeThreadId}`
        );
        if (active) {
          setMessages(dedupeById(detail.messages ?? []));
        }
      } catch (err) {
        if (active) {
          const msg =
            err instanceof ApiError
              ? err.message
              : t('advisor.err.history');
          toast.error(msg);
        }
      } finally {
        if (active) {
          setMessagesLoading(false);
        }
      }
    };
    void loadMessages();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeThreadId]);

  // Auto-scroll to newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const handleNewConsultation = async () => {
    setCreatingThread(true);
    try {
      const title = diagnosisContext
        ? `${crop(diagnosisContext.speciesName ?? '')} — ${condition(diagnosisContext.diseaseName ?? '')}`.slice(
            0,
            80
          )
        : t('advisor.threadTitle', { date: new Date().toLocaleDateString(lang === 'bg' ? 'bg-BG' : 'en-US') });
      const newThread = await apiFetch<ChatThread>('/chat/threads', {
        method: 'POST',
        body: { title },
      });
      setThreads((prev) => dedupeById([newThread, ...prev]));
      setActiveThreadId(newThread.id);
      setMessages([]);
      setMobileSidebarOpen(false);
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : t('advisor.err.createThread');
      toast.error(msg);
    } finally {
      setCreatingThread(false);
    }
  };

  const handleDeleteThread = async (
    e: React.MouseEvent,
    threadId: string
  ) => {
    e.stopPropagation();
    try {
      await apiFetch(`/chat/threads/${threadId}`, { method: 'DELETE' });
      setThreads((prev) => prev.filter((thread) => thread.id !== threadId));
      if (activeThreadId === threadId) {
        setActiveThreadId(null);
        setMessages([]);
      }
      toast.success(t('advisor.deleted'));
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : t('advisor.err.delete');
      toast.error(msg);
    }
  };

  const handleSendMessage = async (textOverride?: string) => {
    const typed = (textOverride ?? prompt).trim();
    const withFiles = !textOverride && attachments.items.length > 0;
    if ((!typed && !withFiles) || sending || attachments.uploading || attachments.hasErrors) return;

    const files = withFiles ? attachments.take() : [];
    const content = typed || t('advisor.defaultPrompt');

    setSending(true);
    setSendingFiles(files.length > 0);
    if (!textOverride) {
      setPrompt('');
    }

    let targetThreadId = activeThreadId;
    let sent = false;

    try {
      // Auto-create thread if none is selected
      if (!targetThreadId) {
        const titleSource = typed || files[0]?.file.name || content;
        const autoTitle =
          titleSource.length > 40 ? `${titleSource.slice(0, 40)}...` : titleSource;
        const created = await apiFetch<ChatThread>('/chat/threads', {
          method: 'POST',
          body: { title: autoTitle.length >= 2 ? autoTitle : t('advisor.inquiryTitle') },
        });
        targetThreadId = created.id;
        skipNextLoadThreadIdRef.current = created.id;
        setThreads((prev) => dedupeById([created, ...prev]));
        setActiveThreadId(created.id);
      }

      // Optimistic user bubble
      tempCounterRef.current += 1;
      const tempId = `temp-${tempCounterRef.current}`;
      const optimisticUserMsg: ChatMessage = {
        id: tempId,
        threadId: targetThreadId,
        role: 'user',
        content,
        attachments: files.length
          ? files.map((f) => ({
              key: f.key ?? f.id,
              name: f.file.name,
              mime: f.mime,
              size: f.file.size,
              kind: f.kind,
              status: 'pending' as const,
              summary: '',
              url: f.previewUrl,
            }))
          : null,
        createdAt: '',
      };
      setMessages((prev) => dedupeById([...prev, optimisticUserMsg]));

      const response = await apiFetch<SendMessageResponse>(
        `/chat/threads/${targetThreadId}/messages`,
        {
          method: 'POST',
          body: {
            content: typed,
            language: lang,
            ...(files.length
              ? { attachments: files.map((f) => ({ key: f.key, name: f.file.name })) }
              : {}),
            ...(activeDiagnosisId ? { diagnosisId: activeDiagnosisId } : {}),
          },
        }
      );
      sent = true;

      setMessages((prev) =>
        dedupeById([
          ...prev.filter((m) => m.id !== tempId),
          response.userMessage,
          response.assistantMessage,
        ])
      );

      if (response.sources && response.sources.length > 0) {
        setSourcesByMessageId((prev) => ({
          ...prev,
          [response.assistantMessage.id]: response.sources,
        }));
      }
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : t('advisor.err.reach');
      toast.error(msg);
    } finally {
      setSending(false);
      setSendingFiles(false);
      if (files.length) {
        // Uploaded files stay reusable after a failed send, so the user can simply retry
        if (sent) {
          releasePreviews(files);
        } else {
          setMessages((prev) => prev.filter((m) => !m.id.startsWith('temp-')));
          attachments.restore(files);
        }
      }
    }
  };

  const canSend =
    (prompt.trim().length > 0 || attachments.items.length > 0) &&
    !sending &&
    !attachments.uploading &&
    !attachments.hasErrors;

  const handleDismissDiagnosis = () => {
    setActiveDiagnosisId(null);
    setDiagnosisContext(null);
  };

  return (
    <div className="flex h-[calc(100vh-7.5rem)] overflow-hidden rounded-xl border border-border bg-card">
      {/* Left Sidebar: Consultation Threads */}
      <aside
        className={cn(
          'flex w-72 shrink-0 flex-col border-r border-border bg-muted/60',
          mobileSidebarOpen
            ? 'fixed inset-y-14 left-0 z-40 lg:static'
            : 'hidden lg:flex'
        )}
      >
        <div className="border-b border-border p-4">
          <Button
            type="button"
            onClick={handleNewConsultation}
            disabled={creatingThread}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            {creatingThread ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            {t('advisor.newConsultation')}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {threadsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          ) : threads.length === 0 ? (
            <div className="px-3 py-8 text-center text-xs text-slate-500">
              {t('advisor.noThreads')}
            </div>
          ) : (
            <div className="space-y-1.5">
              {threads.map((thread) => {
                const isSelected = thread.id === activeThreadId;
                return (
                  <div
                    key={thread.id}
                    onClick={() => {
                      setActiveThreadId(thread.id);
                      setMobileSidebarOpen(false);
                    }}
                    className={cn(
                      'group flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors',
                      isSelected
                        ? 'bg-emerald-100/80 font-semibold text-emerald-950'
                        : 'text-slate-700 hover:bg-slate-200/60'
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <MessageSquareText
                        className={cn(
                          'h-4 w-4 shrink-0',
                          isSelected ? 'text-emerald-700' : 'text-slate-400'
                        )}
                      />
                      <span className="truncate">{thread.title}</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteThread(e, thread.id)}
                      title={t('advisor.deleteThread')}
                      className="rounded p-1 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-100 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      {/* Main Chat Viewport */}
      <div className="flex min-w-0 flex-1 flex-col bg-card">
        {/* Top Bar */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label={t('advisor.toggleSidebar')}
              onClick={() => setMobileSidebarOpen((prev) => !prev)}
            >
              {mobileSidebarOpen ? (
                <PanelLeftClose className="h-4 w-4" />
              ) : (
                <PanelLeftOpen className="h-4 w-4" />
              )}
            </Button>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900">
                {t('advisor.title')}
              </h1>
              <p className="text-xs text-slate-500">
                {t('advisor.subtitle')}
              </p>
            </div>
          </div>
        </div>

        {/* Pinned Diagnosis Context Banner */}
        {diagnosisContext && (
          <div className="flex items-center justify-between gap-4 border-b border-emerald-200 bg-emerald-50 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-emerald-200 bg-card">
                {diagnosisContext.imageUrl.startsWith('http') ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={diagnosisContext.imageUrl}
                    alt={diagnosisContext.speciesName ? crop(diagnosisContext.speciesName) : t('advisor.altCrop')}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Sprout className="h-5 w-5 text-emerald-600" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-semibold text-slate-900">
                    {crop(diagnosisContext.speciesName ?? '')} —{' '}
                    {condition(diagnosisContext.diseaseName ?? '')}
                  </span>
                  <Badge
                    className={cn(
                      'gap-1 text-[11px]',
                      diagnosisContext.isHealthy
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-500 text-slate-950'
                    )}
                  >
                    {diagnosisContext.isHealthy ? (
                      <ShieldCheck className="h-3 w-3" />
                    ) : (
                      <AlertTriangle className="h-3 w-3" />
                    )}
                    {t('advisor.confidence', {
                      percent: ((diagnosisContext.confidence ?? 0) * 100).toFixed(1),
                    })}
                  </Badge>
                </div>
                <p className="text-xs text-slate-600">
                  {t('advisor.contextActive')}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleDismissDiagnosis}
              title={t('advisor.clearContext')}
              className="shrink-0 text-slate-500 hover:text-slate-900"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Scrollable Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {messagesLoading ? (
            <div className="space-y-4">
              <Skeleton className="ml-auto h-14 w-2/3 rounded-2xl" />
              <Skeleton className="h-28 w-3/4 rounded-2xl" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <Sparkles className="h-7 w-7" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                {t('advisor.emptyTitle')}
              </h2>
              <p className="mt-1 max-w-md text-sm text-slate-500">
                {t('advisor.emptyText')}
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {QUICK_PROMPT_KEYS.map((chipKey) => (
                  <button
                    key={chipKey}
                    type="button"
                    onClick={() => handleSendMessage(t(chipKey))}
                    disabled={sending}
                    className="rounded-full border border-emerald-200 bg-emerald-50/70 px-4 py-2 text-xs font-medium text-emerald-900 transition-colors hover:bg-emerald-100"
                  >
                    {t(chipKey)}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                const sources = sourcesByMessageId[msg.id];

                return (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex flex-col',
                      isUser ? 'items-end' : 'items-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed md:max-w-[75%]',
                        isUser
                          ? 'bg-emerald-600 text-white'
                          : 'border border-border bg-muted/60 text-slate-900'
                      )}
                    >
                      {msg.attachments && msg.attachments.length > 0 && (
                        <MessageAttachments attachments={msg.attachments} isUser={isUser} />
                      )}
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <div className="space-y-2 text-sm leading-relaxed text-slate-800 [&_h1]:mt-3 [&_h1]:text-base [&_h1]:font-bold [&_h2]:mt-3 [&_h2]:text-sm [&_h2]:font-bold [&_h3]:mt-2.5 [&_h3]:text-sm [&_h3]:font-semibold [&_li]:ml-4 [&_li]:list-disc [&_ol>li]:list-decimal [&_p]:my-1.5 [&_strong]:font-semibold">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              table: ({ children }) => (
                                <div className="my-3 overflow-x-auto rounded-lg border border-border">
                                  <table className="w-full border-collapse text-left text-xs">
                                    {children}
                                  </table>
                                </div>
                              ),
                              thead: ({ children }) => (
                                <thead className="bg-slate-100 text-slate-900">
                                  {children}
                                </thead>
                              ),
                              th: ({ children }) => (
                                <th className="border-b border-border px-3 py-2 text-left font-semibold">
                                  {children}
                                </th>
                              ),
                              td: ({ children }) => (
                                <td className="border-t border-border px-3 py-2 text-left align-top">
                                  {children}
                                </td>
                              ),
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>

                    {!isUser && sources && sources.length > 0 && (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
                          <BookOpen className="h-3 w-3" />
                          {t('advisor.sources')}
                        </span>
                        {sources.map((src, idx) => (
                          <Badge
                            key={`${msg.id}-src-${src}-${idx}`}
                            variant="outline"
                            className="border-emerald-200 bg-emerald-50/60 text-[11px] text-emerald-800"
                          >
                            {src}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {sending && (
                <div className="flex items-start">
                  <div className="flex items-center gap-2 rounded-2xl border border-border bg-muted/60 px-4 py-3 text-sm text-slate-600">
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                    <span>{t(sendingFiles ? 'advisor.reading' : 'advisor.consulting')}</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Bottom Prompt Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSendMessage();
          }}
          onDragEnter={(e) => {
            if (e.dataTransfer.types.includes('Files')) {
              e.preventDefault();
              setDragging(true);
            }
          }}
          onDragOver={(e) => {
            if (e.dataTransfer.types.includes('Files')) e.preventDefault();
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (!sending && e.dataTransfer.files.length) attachments.addFiles(e.dataTransfer.files);
          }}
          className="relative border-t border-border bg-muted/60 p-4"
        >
          {dragging && (
            <div className="pointer-events-none absolute inset-1.5 z-10 flex items-center justify-center rounded-lg border-2 border-dashed border-emerald-500 bg-emerald-50/90 text-sm font-semibold text-emerald-800">
              <Paperclip className="mr-2 h-4 w-4" />
              {t('advisor.dropHere')}
            </div>
          )}
          <AttachmentChips items={attachments.items} onRemove={attachments.remove} disabled={sending} />
          <input
            ref={fileInputRef}
            type="file"
            accept={CHAT_ACCEPT}
            multiple
            hidden
            onChange={(e) => {
              if (e.target.files?.length) attachments.addFiles(e.target.files);
              e.target.value = '';
            }}
          />
          <div className="flex items-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending || attachments.items.length >= 4}
              aria-label={t('advisor.attach')}
              title={t('advisor.attachHint')}
              className="h-11 w-11 shrink-0 bg-card"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void handleSendMessage();
                }
              }}
              rows={2}
              placeholder={t('advisor.placeholder')}
              disabled={sending}
              className="min-h-[44px] max-h-32 flex-1 resize-none bg-card"
            />
            <Button
              type="submit"
              disabled={!canSend}
              className="h-11 bg-emerald-700 px-4 text-white hover:bg-emerald-800"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdvisorPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl space-y-4">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-[600px] w-full rounded-2xl" />
        </div>
      }
    >
      <AdvisorChatContent />
    </Suspense>
  );
}
