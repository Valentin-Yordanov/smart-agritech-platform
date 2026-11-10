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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import {
  ChatService,
  ChatThreadDetail,
  ChatThreadSummary,
  SendMessageResponse,
} from './chat.service';
import { CreateThreadDto } from './dto/create-thread.dto';
import { SendMessageDto } from './dto/send-message.dto';

@ApiTags('Agronomic Advisory (Chat)')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('api/v1/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('threads')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new agronomic advisory chat thread',
    description: 'Initializes a dedicated consultation session with the RAG agronomic advisor.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Chat thread created successfully.',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Authentication required.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Validation failed.' })
  async createThread(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateThreadDto,
  ) {
    return await this.chatService.createThread(user.id, dto);
  }

  @Get('threads')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List user advisory chat threads',
    description: 'Retrieves all active consultation threads created by the authenticated producer.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User threads retrieved successfully.',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Authentication required.' })
  async getUserThreads(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ChatThreadSummary[]> {
    return await this.chatService.getUserThreads(user.id);
  }

  @Get('threads/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get conversation history of a specific thread',
    description: 'Fetches all messages exchanged between the farmer and the AI agronomist in chronological order.',
  })
  @ApiParam({ name: 'id', description: 'UUID of the chat thread' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Thread conversation history retrieved.',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Authentication required.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Thread not found.' })
  async getThreadById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ChatThreadDetail> {
    return await this.chatService.getThreadById(id, user.id);
  }

  @Post('threads/:id/messages')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send inquiry to agronomic AI advisor (RAG)',
    description: (
      'Appends inquiry to thread, enriches with vision diagnosis context if provided, ' +
      'queries ChromaDB for top-3 relevant guides, and returns Groq Llama-3.1-8b expert advisory.'
    ),
  })
  @ApiParam({ name: 'id', description: 'UUID of the chat thread' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Agronomic response generated and persisted successfully.',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Authentication required.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Thread not found.' })
  @ApiResponse({ status: HttpStatus.BAD_GATEWAY, description: 'AI microservice unreachable or returned error.' })
  async sendMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SendMessageDto,
  ): Promise<SendMessageResponse> {
    return await this.chatService.sendMessage(id, user.id, dto);
  }

  @Delete('threads/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete advisory chat thread and messages',
    description: 'Permanently removes a consultation thread and all associated messages.',
  })
  @ApiParam({ name: 'id', description: 'UUID of the chat thread to remove' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Thread deleted successfully.',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Authentication required.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Thread not found.' })
  async deleteThread(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ success: boolean; message: string }> {
    return await this.chatService.deleteThread(id, user.id);
  }
}
