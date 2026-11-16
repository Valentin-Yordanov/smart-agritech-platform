'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  MessageSquare,
  Send,
  Trash2,
  Loader2,
  UserCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from 'cn';
import { useAuth } from '@/context/auth-context';
import { apiFetch, ApiError } from '@/lib/api';
import { Comment, Post } from '@/types/api';
import { Button, buttonVariants } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

function CommunityThreadDetailContent() {
  const params = useParams<{ id: string }>();
  const postId = params?.id;
  const router = useRouter();
  const { user } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(
    null
  );
  const [deletingPost, setDeletingPost] = useState(false);

  useEffect(() => {
    if (!postId) return;
    let active = true;
    const loadPost = async () => {
      setLoading(true);
      try {
        const data = await apiFetch<Post>(`/community/posts/${postId}`);
        if (active) {
          setPost(data);
        }
      } catch (err) {
        if (active) {
          const msg =
            err instanceof ApiError
              ? err.message
              : 'Failed to load discussion thread';
          toast.error(msg);
          setPost(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    void loadPost();
    return () => {
      active = false;
    };
  }, [postId]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postId || !commentText.trim() || submitting) return;

    if (!user) {
      toast.error('Please sign in to post a comment.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await apiFetch<Comment>(
        `/community/posts/${postId}/comments`,
        {
          method: 'POST',
          body: { content: commentText.trim() },
        }
      );

      setPost((prev) =>
        prev
          ? {
              ...prev,
              comments: [...(prev.comments ?? []), created],
            }
          : prev
      );
      setCommentText('');
      toast.success('Comment added');
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : 'Failed to submit comment';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    setDeletingCommentId(commentId);
    try {
      await apiFetch(`/community/comments/${commentId}`, {
        method: 'DELETE',
      });
      setPost((prev) =>
        prev
          ? {
              ...prev,
              comments: (prev.comments ?? []).filter((c) => c.id !== commentId),
            }
          : prev
      );
      toast.success('Comment deleted');
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : 'Failed to delete comment';
      toast.error(msg);
    } finally {
      setDeletingCommentId(null);
    }
  };

  const handleDeletePost = async () => {
    if (!post) return;
    setDeletingPost(true);
    try {
      await apiFetch(`/community/posts/${post.id}`, { method: 'DELETE' });
      toast.success('Discussion deleted');
      router.push('/community');
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : 'Failed to delete post';
      toast.error(msg);
      setDeletingPost(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Link
          href="/community"
          className={cn(buttonVariants({ variant: 'ghost' }), 'gap-2')}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Community Hub
        </Link>
        <Card className="border-slate-200 py-12 text-center">
          <CardContent>
            <p className="text-base font-semibold text-slate-800">
              Discussion not found
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const comments = post.comments ?? [];
  const canDeletePost =
    user && (user.id === post.authorId || user.role === 'ADMIN');

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/community"
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'gap-2 text-slate-600'
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Community Hub
        </Link>

        {canDeletePost && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleDeletePost}
            disabled={deletingPost}
          >
            {deletingPost ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-3.5 w-3.5" />
            )}
            Delete Post
          </Button>
        )}
      </div>

      {/* Main Post Card */}
      <Card className="border-slate-200">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <UserCircle2 className="h-5 w-5 text-slate-400" />
              <span className="text-sm font-semibold text-slate-900">
                {post.author.fullName}
              </span>
              <Badge
                variant="outline"
                className={cn(
                  'text-[11px] font-semibold',
                  post.author.role !== 'USER'
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 bg-slate-100 text-slate-700'
                )}
              >
                {post.author.role}
              </Badge>
            </div>
            <span className="text-xs text-slate-500">
              {new Date(post.createdAt).toLocaleString()}
            </span>
          </div>

          <CardTitle className="text-2xl font-bold text-slate-900">
            {post.title}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
            {post.content}
          </p>

          {post.imageUrl && (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-950">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.imageUrl}
                alt={post.title}
                className="mx-auto max-h-[460px] w-auto object-contain"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comments Section */}
      <div className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <MessageSquare className="h-5 w-5 text-emerald-600" />
          Peer &amp; Specialist Replies ({comments.length})
        </h2>

        {/* Comment Submission Form */}
        {user ? (
          <form
            onSubmit={handleAddComment}
            className="space-y-3 rounded-xl border border-slate-200 bg-white p-4"
          >
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Share agronomic feedback, recommended active ingredients, or field experience..."
              rows={3}
              minLength={2}
              required
              disabled={submitting}
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={!commentText.trim() || submitting}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Post Reply
              </Button>
            </div>
          </form>
        ) : (
          <Card className="border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-600">
            <Link
              href="/login"
              className="font-semibold text-emerald-700 hover:underline"
            >
              Sign in
            </Link>{' '}
            to join this agronomic discussion.
          </Card>
        )}

        {/* Comment List */}
        {comments.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">
            No replies yet. Be the first to respond.
          </p>
        ) : (
          <div className="space-y-3">
            {comments.map((comment) => {
              const isOwnComment = user?.id === comment.authorId;
              return (
                <Card key={comment.id} className="border-slate-200">
                  <CardContent className="space-y-2 pt-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">
                          {comment.author.fullName}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] font-semibold',
                            comment.author.role !== 'USER'
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                              : 'border-slate-200 bg-slate-100 text-slate-700'
                          )}
                        >
                          {comment.author.role}
                        </Badge>
                        <span className="text-xs text-slate-400">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                      </div>

                      {isOwnComment && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDeleteComment(comment.id)}
                          disabled={deletingCommentId === comment.id}
                          title="Delete comment"
                          className="text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          {deletingCommentId === comment.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      )}
                    </div>

                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                      {comment.content}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CommunityThreadDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl space-y-6">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      }
    >
      <CommunityThreadDetailContent />
    </Suspense>
  );
}
