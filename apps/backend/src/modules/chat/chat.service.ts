import {
  BadGatewayException,
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatMessage, ChatThread, Prisma } from '@prisma/client';
import {
  CHAT_MIME_TYPES,
  IMAGE_MIME_TYPES,
  internalAiHeaders,
  isOwnedChatKey,
} from '../../common/security';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateThreadDto } from './dto/create-thread.dto';
import { MAX_CHAT_IMAGES, SendMessageDto } from './dto/send-message.dto';

export interface StoredAttachment {
  key: string;
  name: string;
  mime: string;
  size: number;
  kind: 'image' | 'document';
  status: 'pending' | 'readable' | 'unreadable';
  summary: string;
}

export interface ChatAttachmentView extends StoredAttachment {
  // Short-lived signed GET URL, only ever generated for the owner of the thread
  url?: string;
}

export type ChatMessageView = Omit<ChatMessage, 'attachments'> & {
  attachments: ChatAttachmentView[] | null;
};

export interface ChatThreadSummary extends ChatThread {
  _count?: {
    messages: number;
  };
}

export interface ChatThreadDetail extends ChatThread {
  messages: ChatMessageView[];
}

export interface SendMessageResponse {
  userMessage: ChatMessageView;
  assistantMessage: ChatMessageView;
  sources: string[];
}

interface RAGApiResponse {
  answer: string;
  sources: string[];
  attachments?: { status: 'readable' | 'unreadable'; summary: string }[];
}

interface DiagnosisContextPayload {
  crop: string;
  disease: string;
  confidence: number;
}

const DEFAULT_ATTACHMENT_PROMPT = {
  en: 'Please analyse the attached file(s).',
  bg: 'Моля, анализирайте прикачените файлове.',
};
const AI_UNAVAILABLE =
  'The AI advisor is temporarily unavailable. Please try again.';
const HISTORY_SUMMARY_CHARS = 300;

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly dailyAttachmentLimit: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly storage: StorageService,
  ) {
    this.dailyAttachmentLimit =
      Number(this.configService.get('CHAT_ATTACHMENT_DAILY_LIMIT') ?? 20) || 20;
  }

  async createThread(
    userId: string,
    dto: CreateThreadDto,
  ): Promise<ChatThread> {
    const thread = await this.prisma.chatThread.create({
      data: {
        userId,
        title: dto.title,
      },
    });

    return thread;
  }

  async getUserThreads(userId: string): Promise<ChatThreadSummary[]> {
    return await this.prisma.chatThread.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });
  }

  async getThreadById(
    threadId: string,
    userId: string,
  ): Promise<ChatThreadDetail> {
    const thread = await this.prisma.chatThread.findFirst({
      where: {
        id: threadId,
        userId,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!thread) {
      throw new NotFoundException(
        `Advisory thread with ID ${threadId} not found`,
      );
    }

    const messages = await Promise.all(
      thread.messages.map((m) => this.toView(m, userId)),
    );
    return { ...thread, messages };
  }

  async deleteThread(
    threadId: string,
    userId: string,
  ): Promise<{ success: boolean; message: string }> {
    const thread = await this.prisma.chatThread.findFirst({
      where: {
        id: threadId,
        userId,
      },
      select: { id: true },
    });

    if (!thread) {
      throw new NotFoundException(
        `Advisory thread with ID ${threadId} not found`,
      );
    }

    await this.prisma.chatThread.delete({
      where: { id: threadId },
    });

    return {
      success: true,
      message: 'Advisory thread deleted successfully',
    };
  }

  async sendMessage(
    threadId: string,
    userId: string,
    dto: SendMessageDto,
  ): Promise<SendMessageResponse> {
    const language = dto.language ?? 'en';
    const refs = dedupeByKey(dto.attachments ?? []);
    const typed = dto.content?.trim() ?? '';
    if (!typed && refs.length === 0) {
      throw new BadRequestException('Type a message or attach a file.');
    }

    // 1. Verify thread belongs to user and load recent message history
    const thread = await this.prisma.chatThread.findFirst({
      where: {
        id: threadId,
        userId,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 6,
        },
      },
    });

    if (!thread) {
      throw new NotFoundException(
        `Advisory thread with ID ${threadId} not found`,
      );
    }

    // 2. Ownership, quota and type checks happen before any Groq quota is spent
    let files: { ref: StoredAttachment; data: Uint8Array }[] = [];
    if (refs.length > 0) {
      if (refs.some((r) => !isOwnedChatKey(r.key, userId))) {
        throw new ForbiddenException(
          'One of the attachments does not belong to your account.',
        );
      }
      await this.assertAttachmentQuota(userId);
      files = await this.loadAttachments(refs);
    }

    // 3. Fetch diagnosis context if provided
    let diagnosisContext: DiagnosisContextPayload | undefined = undefined;
    if (dto.diagnosisId) {
      // Only the caller's own scan can be used as context
      const diag = await this.prisma.diagnosis.findFirst({
        where: { id: dto.diagnosisId, userId },
      });

      if (diag) {
        diagnosisContext = {
          crop: diag.speciesName,
          disease: diag.diseaseName,
          confidence: diag.confidence,
        };
      }
    }

    // 4. Multi-turn history (chronological); earlier files are represented by their saved summaries
    const history = thread.messages
      .slice()
      .reverse()
      .map((msg) => ({
        role: msg.role,
        content: withAttachmentSummaries(
          msg.content,
          asAttachments(msg.attachments),
        ),
      }));

    // 5. Persist user message (attachments start as "pending" and are filled in after the AI reads them)
    const content = typed || DEFAULT_ATTACHMENT_PROMPT[language];
    const userMessage = await this.prisma.chatMessage.create({
      data: {
        threadId,
        role: 'user',
        content,
        ...(files.length > 0
          ? {
              attachments: files.map(
                (f) => f.ref,
              ) as unknown as Prisma.InputJsonValue,
            }
          : {}),
      },
    });

    // 6. Query Python AI RAG Microservice
    const ragResponse =
      files.length > 0
        ? await this.callAttachmentAdvisor(
            threadId,
            content,
            history,
            diagnosisContext,
            language,
            files,
          )
        : await this.callTextAdvisor(
            threadId,
            content,
            history,
            diagnosisContext,
          );

    let savedUserMessage = userMessage;
    if (files.length > 0) {
      const updated: StoredAttachment[] = files.map((f, i) => {
        const result = ragResponse.attachments?.[i];
        return {
          ...f.ref,
          status: result?.status ?? 'unreadable',
          summary: (result?.summary ?? '').slice(0, 600),
        };
      });
      savedUserMessage = await this.prisma.chatMessage.update({
        where: { id: userMessage.id },
        data: { attachments: updated as unknown as Prisma.InputJsonValue },
      });
    }

    // 7. Persist AI assistant message and update thread timestamp
    const assistantMessage = await this.prisma.chatMessage.create({
      data: {
        threadId,
        role: 'assistant',
        content: ragResponse.answer,
      },
    });

    await this.prisma.chatThread.update({
      where: { id: threadId },
      data: { updatedAt: new Date() },
    });

    return {
      userMessage: await this.toView(savedUserMessage, userId),
      assistantMessage: await this.toView(assistantMessage, userId),
      sources: ragResponse.sources || [],
    };
  }

  private aiUrl(path: string): string {
    const rawAiUrl =
      this.configService.get<string>('AI_SERVICE_URL') ||
      'http://localhost:8000';
    const cleanAiUrl = rawAiUrl
      .replace(/\/+$/, '')
      .replace(/\/api\/v1\/(diagnose|rag\/chat)$/, '');
    return `${cleanAiUrl}/api/v1/${path}`;
  }

  // Counts messages with files in the last 24 h so one account cannot drain the shared Groq free tier
  private async assertAttachmentQuota(userId: string): Promise<void> {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const used = await this.prisma.chatMessage.count({
      where: {
        role: 'user',
        createdAt: { gte: since },
        attachments: { not: Prisma.AnyNull },
        thread: { userId },
      },
    });
    if (used >= this.dailyAttachmentLimit) {
      throw new HttpException(
        `Daily limit of ${this.dailyAttachmentLimit} messages with attachments reached. Try again tomorrow.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private async loadAttachments(
    refs: { key: string; name: string }[],
  ): Promise<{ ref: StoredAttachment; data: Uint8Array }[]> {
    const loaded = await Promise.all(
      refs.map(async (ref) => {
        try {
          const object = await this.storage.getPrivateObject(ref.key);
          return { ref, object };
        } catch (err: unknown) {
          if (err instanceof BadRequestException) throw err;
          this.logger.warn(
            `Attachment fetch failed for ${ref.key}: ${err instanceof Error ? err.message : err}`,
          );
          throw new BadRequestException(
            `"${ref.name}" could not be found. Please attach it again.`,
          );
        }
      }),
    );

    // The MIME type is the one signed into the upload URL, not anything the client sends now
    const files = loaded.map(({ ref, object }) => {
      const mime = object.contentType.split(';')[0].trim().toLowerCase();
      if (!CHAT_MIME_TYPES.includes(mime)) {
        throw new BadRequestException(
          `"${ref.name}" has an unsupported file type.`,
        );
      }
      const kind: StoredAttachment['kind'] = (
        IMAGE_MIME_TYPES as readonly string[]
      ).includes(mime)
        ? 'image'
        : 'document';
      return {
        ref: {
          key: ref.key,
          name: ref.name,
          mime,
          size: object.size,
          kind,
          status: 'pending',
          summary: '',
        } as StoredAttachment,
        data: object.data,
      };
    });

    if (files.filter((f) => f.ref.kind === 'image').length > MAX_CHAT_IMAGES) {
      throw new BadRequestException(
        `At most ${MAX_CHAT_IMAGES} images can be attached to one message.`,
      );
    }
    return files;
  }

  private async callTextAdvisor(
    threadId: string,
    query: string,
    history: { role: string; content: string }[],
    diagnosisContext?: DiagnosisContextPayload,
  ): Promise<RAGApiResponse> {
    const ragUrl = this.aiUrl('rag/chat');
    this.logger.log(
      `Dispatching RAG request to ${ragUrl} for thread ${threadId}...`,
    );
    return this.postToAi(ragUrl, 60_000, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...internalAiHeaders(this.configService),
      },
      body: JSON.stringify({
        query,
        history,
        diagnosis_context: diagnosisContext,
      }),
    });
  }

  private async callAttachmentAdvisor(
    threadId: string,
    message: string,
    history: { role: string; content: string }[],
    diagnosisContext: DiagnosisContextPayload | undefined,
    language: 'en' | 'bg',
    files: { ref: StoredAttachment; data: Uint8Array }[],
  ): Promise<RAGApiResponse> {
    const form = new FormData();
    form.append('message', message);
    form.append('language', language);
    form.append('history', JSON.stringify(history));
    if (diagnosisContext) {
      form.append('diagnosis_context', JSON.stringify(diagnosisContext));
    }
    for (const { ref, data } of files) {
      form.append(
        'files',
        new Blob([Buffer.from(data)], { type: ref.mime }),
        ref.name,
      );
    }

    const url = this.aiUrl('rag/chat-with-attachments');
    this.logger.log(
      `Dispatching attachment RAG request (${files.length} files) for thread ${threadId}...`,
    );
    // Content-Type is left to fetch so the multipart boundary is set correctly
    return this.postToAi(url, 120_000, {
      method: 'POST',
      headers: internalAiHeaders(this.configService),
      body: form,
    });
  }

  private async postToAi(
    url: string,
    timeoutMs: number,
    init: RequestInit,
  ): Promise<RAGApiResponse> {
    let response: Response;
    try {
      response = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to reach AI Microservice: ${message}`);
      throw new BadGatewayException(AI_UNAVAILABLE);
    }

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(
        `AI Microservice error (${response.status}): ${errorText}`,
      );
      // File-level rejections (bad type, too many images) are safe and useful to show the user
      if (response.status === 400 || response.status === 413) {
        const detail = safeDetail(errorText);
        throw new BadRequestException(
          detail ?? 'One of the attached files could not be processed.',
        );
      }
      throw new BadGatewayException(AI_UNAVAILABLE);
    }

    return (await response.json()) as RAGApiResponse;
  }

  private async toView(
    message: ChatMessage,
    userId: string,
  ): Promise<ChatMessageView> {
    const attachments = asAttachments(message.attachments);
    if (!attachments) {
      return { ...message, attachments: null };
    }
    const withUrls = await Promise.all(
      attachments.map(async (a) => {
        if (!isOwnedChatKey(a.key, userId)) return a;
        try {
          return { ...a, url: await this.storage.getPrivateDownloadUrl(a.key) };
        } catch {
          return a;
        }
      }),
    );
    return { ...message, attachments: withUrls };
  }
}

function dedupeByKey<T extends { key: string }>(items: T[]): T[] {
  return Array.from(new Map(items.map((item) => [item.key, item])).values());
}

function asAttachments(
  value: Prisma.JsonValue | null,
): StoredAttachment[] | null {
  return Array.isArray(value) ? (value as unknown as StoredAttachment[]) : null;
}

function withAttachmentSummaries(
  content: string,
  attachments: StoredAttachment[] | null,
): string {
  if (!attachments?.length) return content;
  const lines = attachments.map(
    (a) =>
      `- ${a.name} (${a.kind}): ${(a.summary || 'not processed').slice(0, HISTORY_SUMMARY_CHARS)}`,
  );
  return `${content}\n\n[Previously attached files]\n${lines.join('\n')}`;
}

function safeDetail(body: string): string | null {
  try {
    const parsed = JSON.parse(body) as { detail?: unknown };
    return typeof parsed.detail === 'string'
      ? parsed.detail.slice(0, 200)
      : null;
  } catch {
    return null;
  }
}
