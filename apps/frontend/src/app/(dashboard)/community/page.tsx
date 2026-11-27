'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  MessageSquare,
  ImagePlus,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Users,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from 'cn';
import { useAuth } from '@/context/auth-context';
import { apiFetch, ApiError } from '@/lib/api';
import { PaginatedResponse, Post } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useI18n } from '@/i18n/language-provider';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PresignedUploadResponse {
  uploadUrl: string;
  fileKey: string;
  publicUrl: string;
}

export default function CommunityFeedPage() {
  const { user } = useAuth();
  const { t, tr, lang } = useI18n();
  const dateLocale = lang === 'bg' ? 'bg-BG' : undefined;

  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [refreshTick, setRefreshTick] = useState(0);

  // New Discussion Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch paginated posts
  useEffect(() => {
    let active = true;
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: '10',
          ...(debouncedSearch ? { search: debouncedSearch } : {}),
        });
        const res = await apiFetch<PaginatedResponse<Post>>(
          `/community/posts?${params.toString()}`
        );
        if (active) {
          setPosts(res.data);
          setTotalPages(res.meta.totalPages || 1);
          setTotal(res.meta.total || 0);
        }
      } catch (err) {
        if (active) {
          const msg =
            err instanceof ApiError
              ? err.message
              : t('com.err.load');
          toast.error(msg);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    void fetchPosts();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, refreshTick]);

  // Cleanup preview object URL
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleImageChange = (file: File | undefined | null) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error(t('com.err.format'));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('com.err.size'));
      return;
    }
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error(t('com.signInToStartShort'));
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl: string | undefined;

      if (imageFile) {
        const presigned = await apiFetch<PresignedUploadResponse>(
          '/storage/upload-url',
          {
            method: 'POST',
            body: {
              filename: imageFile.name,
              mimeType: imageFile.type,
              folder: 'community',
              size: imageFile.size,
            },
          }
        );

        const uploadRes = await fetch(presigned.uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': imageFile.type },
          body: imageFile,
        });

        if (!uploadRes.ok) {
          throw new Error(t('com.err.upload', { status: uploadRes.status }));
        }
        imageUrl = presigned.publicUrl;
      }

      await apiFetch<Post>('/community/posts', {
        method: 'POST',
        body: {
          title: title.trim(),
          content: content.trim(),
          ...(imageUrl ? { imageUrl } : {}),
        },
      });

      toast.success(t('com.published'));
      setDialogOpen(false);
      setTitle('');
      setContent('');
      setImageFile(null);
      setImagePreview(null);
      setPage(1);
      setRefreshTick((tick) => tick + 1);
    } catch (err) {
      const msg =
        err instanceof ApiError || err instanceof Error
          ? err.message
          : t('com.err.publish');
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
            <Users className="h-6 w-6 text-emerald-600" />
            {t('com.title')}
          </h1>
          <p className="text-sm text-slate-600">
            {t('com.subtitle', { total })}
          </p>
        </div>

        <Button
          type="button"
          onClick={() => {
            if (!user) {
              toast.error(t('com.signInToStart'));
              return;
            }
            setDialogOpen(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t('com.newDiscussion')}
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder={t('com.searchPlaceholder')}
          className="bg-card pl-10"
        />
      </div>

      {/* Post Feed */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-44 w-full rounded-xl" />
          <Skeleton className="h-44 w-full rounded-xl" />
          <Skeleton className="h-44 w-full rounded-xl" />
        </div>
      ) : posts.length === 0 ? (
        <Card className="border-border py-12 text-center">
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-base font-semibold text-slate-800">
                {t('com.noneFound')}
              </p>
              <p className="text-sm text-slate-500">
                {debouncedSearch
                  ? t('com.noMatch', { query: debouncedSearch })
                  : t('com.beFirst')}
              </p>
            </div>
            {debouncedSearch ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSearchInput('')}
              >
                {t('com.clearSearch')}
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  if (!user) {
                    toast.error(t('com.signInToStart'));
                    return;
                  }
                  setDialogOpen(true);
                }}
                className="bg-emerald-700 text-white hover:bg-emerald-800"
              >
                <Plus className="mr-2 h-4 w-4" />
                {t('com.startFirst')}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const isSpecialist = post.author.role !== 'USER';
            return (
              <Link
                key={post.id}
                href={`/community/${post.id}`}
                className="block"
              >
                <Card className="border-border transition-colors hover:border-emerald-300">
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">
                          {post.author.fullName}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[11px] font-semibold',
                            isSpecialist
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                              : 'border-border bg-slate-100 text-slate-700'
                          )}
                        >
                          {tr(`role.${post.author.role}`, post.author.role)}
                        </Badge>
                      </div>
                      <span className="text-xs text-slate-500">
                        {new Date(post.createdAt).toLocaleDateString(dateLocale, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <CardTitle className="pt-1 text-lg text-slate-900">
                      {post.title}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-3 pb-3">
                    <CardDescription className="line-clamp-3 text-sm leading-relaxed text-slate-600">
                      {post.content}
                    </CardDescription>

                    {post.imageUrl && (
                      <div className="overflow-hidden rounded-lg border border-border bg-slate-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={post.imageUrl}
                          alt={post.title}
                          className="max-h-64 w-full object-cover"
                        />
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="border-t border-slate-100 pt-3 text-xs font-medium text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                      <span>
                        {(post._count?.comments ?? 0) === 1
                          ? t('com.commentOne', { count: 1 })
                          : t('com.commentMany', { count: post._count?.comments ?? 0 })}
                      </span>
                    </div>
                  </CardFooter>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border pt-4">
          <p className="text-xs text-slate-500">
            {t('com.page', { page, total: totalPages })}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              {t('com.previous')}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
            >
              {t('com.next')}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* New Discussion Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('com.dialogTitle')}</DialogTitle>
            <DialogDescription>
              {t('com.dialogText')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreatePost} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="post-title">{t('com.fieldTitle')}</Label>
              <Input
                id="post-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('com.titlePlaceholder')}
                minLength={5}
                maxLength={150}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="post-content">{t('com.fieldDetails')}</Label>
              <Textarea
                id="post-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t('com.detailsPlaceholder')}
                rows={5}
                minLength={10}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="post-image">{t('com.fieldImage')}</Label>
              <div className="flex items-center gap-3">
                <label
                  htmlFor="post-image"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-muted/60 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  <ImagePlus className="h-4 w-4 text-emerald-600" />
                  {imageFile ? imageFile.name : t('com.attachPhoto')}
                </label>
                <input
                  id="post-image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => handleImageChange(e.target.files?.[0])}
                />
                {imageFile && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t('com.removeImage')}
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {imagePreview && (
                <div className="mt-2 overflow-hidden rounded-lg border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt={t('com.previewAlt')}
                    className="max-h-40 w-full object-cover"
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={submitting}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {submitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t('com.publish')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
