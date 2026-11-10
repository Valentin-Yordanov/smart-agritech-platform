import {
  BadGatewayException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatMessage, ChatThread } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateThreadDto } from './dto/create-thread.dto';
import { SendMessageDto } from './dto/send-message.dto';

export interface ChatThreadSummary extends ChatThread {
  _count?: {
    messages: number;
  };
}

export interface ChatThreadDetail extends ChatThread {
  messages: ChatMessage[];
}

export interface SendMessageResponse {
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
  sources: string[];
}

interface RAGApiResponse {
  answer: string;
  sources: string[];
}

interface DiagnosisContextPayload {
  crop: string;
  disease: string;
  confidence: number;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async createThread(userId: string, dto: CreateThreadDto): Promise<ChatThread> {
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

  async getThreadById(threadId: string, userId: string): Promise<ChatThreadDetail> {
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
      throw new NotFoundException(`Advisory thread with ID ${threadId} not found`);
    }

    return thread;
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
      throw new NotFoundException(`Advisory thread with ID ${threadId} not found`);
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
      throw new NotFoundException(`Advisory thread with ID ${threadId} not found`);
    }

    // 2. Fetch diagnosis context if provided
    let diagnosisContext: DiagnosisContextPayload | undefined = undefined;
    if (dto.diagnosisId) {
      const diag = await this.prisma.diagnosis.findUnique({
        where: { id: dto.diagnosisId },
      });

      if (diag) {
        diagnosisContext = {
          crop: diag.speciesName,
          disease: diag.diseaseName,
          confidence: diag.confidence,
        };
      }
    }

    // 3. Prepare multi-turn history (reversed from desc to chronological asc)
    const history = thread.messages
      .slice()
      .reverse()
      .map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

    // 4. Persist user message to database
    const userMessage = await this.prisma.chatMessage.create({
      data: {
        threadId,
        role: 'user',
        content: dto.content,
      },
    });

    // 5. Query Python AI RAG Microservice
    const aiBaseUrl =
      this.configService.get<string>('AI_SERVICE_URL') || 'http://localhost:8000';
    const ragUrl = `${aiBaseUrl}/api/v1/rag/chat`;

    let ragResponse: RAGApiResponse;
    try {
      this.logger.log(`Dispatching RAG request to ${ragUrl} for thread ${threadId}...`);
      const response = await fetch(ragUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: dto.content,
          history,
          diagnosis_context: diagnosisContext,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`AI Microservice error (${response.status}): ${errorText}`);
        throw new BadGatewayException(
          `AI Agronomic Advisory service error: ${response.statusText}`,
        );
      }

      ragResponse = (await response.json()) as RAGApiResponse;
    } catch (err: unknown) {
      if (err instanceof BadGatewayException) {
        throw err;
      }
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to reach AI Microservice: ${message}`);
      throw new BadGatewayException(
        `Unable to connect to AI Agronomic Advisory microservice: ${message}`,
      );
    }

    // 6. Persist AI assistant message and update thread timestamp
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
      userMessage,
      assistantMessage,
      sources: ragResponse.sources || [],
    };
  }
}
