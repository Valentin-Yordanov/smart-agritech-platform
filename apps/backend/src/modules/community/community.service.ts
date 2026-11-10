import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { PostQueryDto } from './dto/post-query.dto';

export interface AuthorSummary {
  id: string;
  fullName: string;
  role: Role;
}

export interface PostResponse {
  id: string;
  authorId: string;
  title: string;
  content: string;
  imageUrl: string | null;
  createdAt: Date;
  author: AuthorSummary;
  _count?: {
    comments: number;
  };
}

export interface CommentResponse {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: Date;
  author: AuthorSummary;
}

export interface PostDetailResponse extends PostResponse {
  comments: CommentResponse[];
}

export interface PaginatedPostsResponse {
  data: PostResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class CommunityService {
  constructor(private readonly prisma: PrismaService) {}

  async createPost(authorId: string, dto: CreatePostDto): Promise<PostResponse> {
    const post = await this.prisma.post.create({
      data: {
        authorId,
        title: dto.title,
        content: dto.content,
        imageUrl: dto.imageUrl || null,
      },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            role: true,
          },
        },
      },
    });

    return post;
  }

  async findAllPosts(query: PostQueryDto): Promise<PaginatedPostsResponse> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const where = query.search
      ? {
          OR: [
            { title: { contains: query.search, mode: 'insensitive' as const } },
            { content: { contains: query.search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [total, posts] = await Promise.all([
      this.prisma.post.count({ where }),
      this.prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              fullName: true,
              role: true,
            },
          },
          _count: {
            select: {
              comments: true,
            },
          },
        },
      }),
    ]);

    return {
      data: posts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findPostById(id: string): Promise<PostDetailResponse> {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            role: true,
          },
        },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: {
                id: true,
                fullName: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    return post;
  }

  async addComment(
    postId: string,
    authorId: string,
    dto: CreateCommentDto,
  ): Promise<CommentResponse> {
    // Validate post exists
    const postExists = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!postExists) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    const comment = await this.prisma.comment.create({
      data: {
        postId,
        authorId,
        content: dto.content,
      },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            role: true,
          },
        },
      },
    });

    return comment;
  }

  async deletePost(
    postId: string,
    userId: string,
    userRole: Role,
  ): Promise<{ success: boolean; message: string }> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true },
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    if (post.authorId !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException(
        'You do not have permission to delete this post. Only the author or an administrator can delete it.',
      );
    }

    await this.prisma.post.delete({
      where: { id: postId },
    });

    return {
      success: true,
      message: 'Post deleted successfully',
    };
  }
}
