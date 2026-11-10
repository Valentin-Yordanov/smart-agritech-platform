import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { BadGatewayException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatService } from './chat.service';

describe('ChatService', () => {
  let service: ChatService;

  const mockPrismaService = {
    chatThread: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    chatMessage: {
      create: jest.fn(),
    },
    diagnosis: {
      findUnique: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('http://localhost:8000'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createThread', () => {
    it('should create and return chat thread', async () => {
      const expected = {
        id: 'thread-1',
        userId: 'user-1',
        title: 'Tomato Disease Discussion',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.chatThread.create.mockResolvedValue(expected);

      const result = await service.createThread('user-1', {
        title: 'Tomato Disease Discussion',
      });
      expect(result).toEqual(expected);
      expect(mockPrismaService.chatThread.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          title: 'Tomato Disease Discussion',
        },
      });
    });
  });

  describe('getUserThreads', () => {
    it('should retrieve threads with message count', async () => {
      const threads = [
        {
          id: 'thread-1',
          userId: 'user-1',
          title: 'Thread 1',
          _count: { messages: 5 },
        },
      ];
      mockPrismaService.chatThread.findMany.mockResolvedValue(threads);

      const result = await service.getUserThreads('user-1');
      expect(result).toEqual(threads);
      expect(mockPrismaService.chatThread.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { updatedAt: 'desc' },
        include: { _count: { select: { messages: true } } },
      });
    });
  });

  describe('sendMessage', () => {
    it('should throw NotFoundException if thread does not belong to user', async () => {
      mockPrismaService.chatThread.findFirst.mockResolvedValue(null);

      await expect(
        service.sendMessage('thread-x', 'user-1', { content: 'Hello' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should dispatch query to RAG endpoint and persist messages', async () => {
      const thread = {
        id: 'thread-1',
        userId: 'user-1',
        title: 'Tomato Advisory',
        messages: [
          { role: 'user', content: 'What is wrong with my leaves?' },
          { role: 'assistant', content: 'Please provide symptoms.' },
        ],
      };
      mockPrismaService.chatThread.findFirst.mockResolvedValue(thread);

      const userMessage = {
        id: 'msg-user',
        threadId: 'thread-1',
        role: 'user',
        content: 'They have brown spots with rings.',
        createdAt: new Date(),
      };
      const assistantMessage = {
        id: 'msg-ai',
        threadId: 'thread-1',
        role: 'assistant',
        content: 'This sounds like Early Blight.',
        createdAt: new Date(),
      };

      mockPrismaService.chatMessage.create
        .mockResolvedValueOnce(userMessage)
        .mockResolvedValueOnce(assistantMessage);

      // Mock global fetch
      const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({
          answer: 'This sounds like Early Blight.',
          sources: ['tomato_early_blight.md'],
        }),
      } as Response);

      const result = await service.sendMessage('thread-1', 'user-1', {
        content: 'They have brown spots with rings.',
      });

      expect(result.userMessage).toEqual(userMessage);
      expect(result.assistantMessage).toEqual(assistantMessage);
      expect(result.sources).toEqual(['tomato_early_blight.md']);
      expect(mockPrismaService.chatThread.update).toHaveBeenCalledWith({
        where: { id: 'thread-1' },
        data: { updatedAt: expect.any(Date) },
      });

      fetchSpy.mockRestore();
    });

    it('should throw BadGatewayException if RAG service fails', async () => {
      mockPrismaService.chatThread.findFirst.mockResolvedValue({
        id: 'thread-1',
        userId: 'user-1',
        messages: [],
      });
      mockPrismaService.chatMessage.create.mockResolvedValue({
        id: 'msg-1',
        role: 'user',
        content: 'Test',
      });

      const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Error',
        text: async () => 'Service down',
      } as Response);

      await expect(
        service.sendMessage('thread-1', 'user-1', { content: 'Test' }),
      ).rejects.toThrow(BadGatewayException);

      fetchSpy.mockRestore();
    });
  });
});
