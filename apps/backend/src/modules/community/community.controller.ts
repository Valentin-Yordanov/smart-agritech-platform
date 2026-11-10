import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import {
  CommentResponse,
  CommunityService,
  PaginatedPostsResponse,
  PostDetailResponse,
  PostResponse,
} from './community.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { PostQueryDto } from './dto/post-query.dto';

@ApiTags('Community Hub')
@Controller('api/v1/community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Post('posts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new community agronomy post',
    description: 'Publishes an agronomy observation, inquiry, or field report tied to the authenticated user.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Post published successfully.',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Authentication required.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Validation failed.' })
  async createPost(
    @Body() dto: CreatePostDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PostResponse> {
    return await this.communityService.createPost(user.id, dto);
  }

  @Public()
  @Get('posts')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List community posts with pagination and search',
    description: 'Retrieves published posts ordered chronologically with comment counts and author metadata.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Paginated posts retrieved successfully.',
  })
  async findAllPosts(@Query() query: PostQueryDto): Promise<PaginatedPostsResponse> {
    return await this.communityService.findAllPosts(query);
  }

  @Public()
  @Get('posts/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get single post by ID with comments',
    description: 'Fetches detailed view of a post along with all peer and expert comments.',
  })
  @ApiParam({ name: 'id', description: 'UUID of the target post' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Post details retrieved.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Post not found.' })
  async findPostById(@Param('id', ParseUUIDPipe) id: string): Promise<PostDetailResponse> {
    return await this.communityService.findPostById(id);
  }

  @Post('posts/:id/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add a comment or advice to a post',
    description: 'Enables agricultural producers and certified experts to participate in community discussions.',
  })
  @ApiParam({ name: 'id', description: 'UUID of the post to comment on' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Comment created successfully.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Authentication required.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Post not found.' })
  async addComment(
    @Param('id', ParseUUIDPipe) postId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCommentDto,
  ): Promise<CommentResponse> {
    return await this.communityService.addComment(postId, user.id, dto);
  }

  @Delete('posts/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a community post',
    description: 'Deletes a post. Permitted only for the original post author or users with ADMIN role.',
  })
  @ApiParam({ name: 'id', description: 'UUID of the post to delete' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Post deleted successfully.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Authentication required.' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Unauthorized to delete this post.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Post not found.' })
  async deletePost(
    @Param('id', ParseUUIDPipe) postId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ success: boolean; message: string }> {
    return await this.communityService.deletePost(postId, user.id, user.role);
  }
}
