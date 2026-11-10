import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CommunityService } from './community.service';

describe('CommunityService', () => {
  let service: CommunityService;

  const mockPrismaService = {
    post: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    comment: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommunityService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CommunityService>(CommunityService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPost', () => {
    it('should create and return a post', async () => {
      const authorId = 'user-123';
      const dto = {
        title: 'Blight in tomato field',
        content: 'Concentric rings observed on lower foliage.',
        imageUrl: 'https://example.com/leaf.jpg',
      };

      const expectedPost = {
        id: 'post-1',
        authorId,
        ...dto,
        createdAt: new Date(),
        author: { id: authorId, fullName: 'Agronomist John', role: Role.USER },
      };

      mockPrismaService.post.create.mockResolvedValue(expectedPost);

      const result = await service.createPost(authorId, dto);
      expect(result).toEqual(expectedPost);
      expect(mockPrismaService.post.create).toHaveBeenCalledWith({
        data: {
          authorId,
          title: dto.title,
          content: dto.content,
          imageUrl: dto.imageUrl,
        },
        include: {
          author: {
            select: { id: true, fullName: true, role: true },
          },
        },
      });
    });
  });

  describe('findAllPosts', () => {
    it('should return paginated posts with metadata', async () => {
      mockPrismaService.post.count.mockResolvedValue(1);
      mockPrismaService.post.findMany.mockResolvedValue([
        {
          id: 'post-1',
          title: 'Powdery Mildew on Cucumbers',
          content: 'Foliar white powder patches observed.',
          author: { id: 'u1', fullName: 'Farmer Jane', role: Role.USER },
          _count: { comments: 2 },
        },
      ]);

      const result = await service.findAllPosts({ page: 1, limit: 10 });
      expect(result.data.length).toBe(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });
  });

  describe('findPostById', () => {
    it('should throw NotFoundException if post does not exist', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(null);
      await expect(service.findPostById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return post with author and comments', async () => {
      const mockPost = {
        id: 'post-1',
        title: 'Aphid outbreak',
        author: { id: 'u1', fullName: 'Farmer Jane', role: Role.USER },
        comments: [],
      };
      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);

      const result = await service.findPostById('post-1');
      expect(result).toEqual(mockPost);
    });
  });

  describe('deletePost', () => {
    it('should throw ForbiddenException if user is not author or admin', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue({
        id: 'post-1',
        authorId: 'original-author',
      });

      await expect(
        service.deletePost('post-1', 'intruder-id', Role.USER),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow deletion by post author', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue({
        id: 'post-1',
        authorId: 'user-1',
      });
      mockPrismaService.post.delete.mockResolvedValue({});

      const result = await service.deletePost('post-1', 'user-1', Role.USER);
      expect(result.success).toBe(true);
      expect(mockPrismaService.post.delete).toHaveBeenCalledWith({
        where: { id: 'post-1' },
      });
    });

    it('should allow deletion by ADMIN even if not author', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue({
        id: 'post-1',
        authorId: 'user-1',
      });
      mockPrismaService.post.delete.mockResolvedValue({});

      const result = await service.deletePost('post-1', 'admin-id', Role.ADMIN);
      expect(result.success).toBe(true);
    });
  });
});
