'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  UploadCloud,
  Camera,
  MapPin,
  WifiOff,
  Wifi,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  MessageSquareText,
  Sparkles,
  RotateCcw,
  Cpu,
  FlaskConical,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from 'cn';
import { apiFetch, ApiError } from '@/lib/api';
import { runEdgeInference } from '@/lib/edge-inference';
import { Diagnosis, DiagnosisStatus, RawDetection } from '@/types/api';
import { DetectionCanvas } from '@/components/scan/detection-canvas';
import { ConfidenceBreakdown } from '@/components/scan/confidence-breakdown';
import { UncertainGuidance } from '@/components/scan/uncertain-guidance';
import { useOnlineStatus } from '@/lib/use-online-status';
import { addScanToHistory } from '@/lib/scan-history';
import { MODEL_INFO, SAMPLE_SPECIMENS, SampleSpecimen, isUncertainResult } from '@/lib/platform-info';
import { useI18n } from '@/i18n/language-provider';
import type { MessageKey } from '@/i18n/messages';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

type ScanStage =
  | 'idle'
  | 'uploading'
  | 'localizing'
  | 'classifying'
  | 'offline_running'
  | 'completed'
  | 'failed';

interface PresignedUploadResponse {
  uploadUrl: string;
  fileKey: string;
  publicUrl: string;
}

interface QueueDiagnosisResponse {
  diagnosisId?: string;
  id?: string;
  status: DiagnosisStatus;
}

interface BackendDiagnosisPayload {
  id: string;
  userId?: string;
  status: DiagnosisStatus;
  imageUrl: string;
  speciesName?: string | null;
  species?: string | null;
  diseaseName?: string | null;
  disease?: string | null;
  confidence: number | null;
  isHealthy: boolean | null;
  rawDetections: RawDetection[] | null;
  latitude: number | null;
  longitude: number | null;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt?: string;
}

interface ScanResult {
  id: string | null;
  imageUrl: string;
  speciesName: string;
  diseaseName: string;
  confidence: number;
  isHealthy: boolean;
  rawDetections: RawDetection[] | null;
  mode: 'cloud' | 'offline';
}

const CLOUD_PIPELINE_STEPS: { key: ScanStage; labelKey: MessageKey }[] = [
  { key: 'uploading', labelKey: 'scan.step.upload' },
  { key: 'localizing', labelKey: 'scan.step.localize' },
  { key: 'classifying', labelKey: 'scan.step.classify' },
];

const SAMPLE_TEXT_KEYS: Record<string, { label: MessageKey; hint: MessageKey }> = {
  '/samples/banana_leaf_sigatoka.jpg': { label: 'scan.sample.banana', hint: 'scan.sample.bananaHint' },
  '/samples/maize_leaf_streak.jpg': { label: 'scan.sample.maize', hint: 'scan.sample.maizeHint' },
  '/samples/apple_leaf_alternaria.jpg': { label: 'scan.sample.apple', hint: 'scan.sample.appleHint' },
  '/samples/non_plant_brick.jpg': { label: 'scan.sample.brick', hint: 'scan.sample.brickHint' },
};

export default function ScanPage() {
  const { t, crop, condition } = useI18n();
  const isOnline = useOnlineStatus();
  const dragDepthRef = useRef(0);
  const [loadingSample, setLoadingSample] = useState<string | null>(null);

  const [manualOffline, setManualOffline] = useState(false);
  const offlineMode = !isOnline || manualOffline;

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [attachGeo, setAttachGeo] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [locating, setLocating] = useState(false);

  const [stage, setStage] = useState<ScanStage>('idle');
  const [result, setResult] = useState<ScanResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
      }
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const validateAndSelectFile = useCallback(
    (file: File | undefined | null) => {
      if (!file) return;

      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        toast.error(t('scan.toast.unsupported'));
        return;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast.error(t('scan.toast.tooLarge'));
        return;
      }

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      const objectUrl = URL.createObjectURL(file);
      setSelectedFile(file);
      setPreviewUrl(objectUrl);
      setResult(null);
      setStage('idle');
    },
    [previewUrl, t]
  );

  const loadSample = async (sample: SampleSpecimen) => {
    setLoadingSample(sample.file);
    try {
      const res = await fetch(sample.file);
      if (!res.ok) throw new Error(t('scan.toast.sampleMissing', { status: res.status }));
      const blob = await res.blob();
      const name = sample.file.split('/').pop() ?? 'sample.jpg';
      validateAndSelectFile(new File([blob], name, { type: blob.type || 'image/jpeg' }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('scan.toast.sampleFailed'));
    } finally {
      setLoadingSample(null);
    }
  };

  const recordResult = useCallback((r: ScanResult) => {
    setResult(r);
    addScanToHistory({
      id: r.id,
      speciesName: r.speciesName,
      diseaseName: r.diseaseName,
      confidence: r.confidence,
      isHealthy: r.isHealthy,
      uncertain: isUncertainResult(r.speciesName, r.diseaseName),
      mode: r.mode,
      createdAt: new Date().toISOString(),
    });
  }, []);

  const handleToggleGeo = () => {
    if (attachGeo) {
      setAttachGeo(false);
      setCoords(null);
      return;
    }

    if (!navigator.geolocation) {
      toast.error(t('scan.geoUnsupported'));
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
        });
        setAttachGeo(true);
        setLocating(false);
        toast.success(t('scan.geoSuccess'));
      },
      (err) => {
        setLocating(false);
        setAttachGeo(false);
        toast.error(t('scan.geoFailed', { message: err.message }));
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleReset = () => {
    cancelledRef.current = true;
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
    }
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setStage('idle');
  };

  const pollDiagnosis = useCallback(
    async (diagnosisId: string, localPreviewUrl: string): Promise<void> => {
      while (!cancelledRef.current) {
        const polled = await apiFetch<BackendDiagnosisPayload>(
          `/diagnoses/${diagnosisId}`
        );

        if (cancelledRef.current) return;

        if (polled.status === 'PENDING') {
          setStage('localizing');
          await new Promise<void>((resolve) => {
            pollTimerRef.current = setTimeout(resolve, 1500);
          });
          continue;
        }

        if (polled.status === 'PROCESSING') {
          setStage('classifying');
          await new Promise<void>((resolve) => {
            pollTimerRef.current = setTimeout(resolve, 1500);
          });
          continue;
        }

        if (polled.status === 'FAILED') {
          setStage('failed');
          throw new Error(polled.errorMessage || t('scan.toast.cloudFailed'));
        }

        const normalized: Diagnosis = {
          id: polled.id,
          userId: polled.userId ?? '',
          status: polled.status,
          imageUrl: localPreviewUrl,
          speciesName: polled.speciesName ?? polled.species ?? t('scan.unknownSpecies'),
          diseaseName:
            polled.diseaseName ?? polled.disease ?? t('scan.unknownCondition'),
          confidence: polled.confidence ?? 0,
          isHealthy: polled.isHealthy ?? false,
          rawDetections: polled.rawDetections ?? null,
          latitude: polled.latitude ?? null,
          longitude: polled.longitude ?? null,
          errorMessage: polled.errorMessage ?? null,
          createdAt: polled.createdAt,
          updatedAt: polled.updatedAt ?? polled.createdAt,
        };

        recordResult({
          id: normalized.id,
          imageUrl: localPreviewUrl,
          speciesName: normalized.speciesName ?? t('scan.unknownSpecies'),
          diseaseName: normalized.diseaseName ?? t('scan.unknownCondition'),
          confidence: normalized.confidence ?? 0,
          isHealthy: normalized.isHealthy ?? false,
          rawDetections: normalized.rawDetections,
          mode: 'cloud',
        });
        setStage('completed');
        toast.success(t('scan.toast.cloudDone'));
        return;
      }
    },
    [recordResult, t]
  );

  const handleRunScan = async () => {
    if (!selectedFile || !previewUrl) {
      toast.error(t('scan.toast.noFile'));
      return;
    }

    cancelledRef.current = false;
    setResult(null);

    if (offlineMode) {
      try {
        setStage('offline_running');
        const edgeRes = await runEdgeInference(selectedFile);
        if (cancelledRef.current) return;

        recordResult({
          id: null,
          imageUrl: previewUrl,
          speciesName: edgeRes.speciesName,
          diseaseName: edgeRes.diseaseName,
          confidence: edgeRes.confidence,
          isHealthy: edgeRes.isHealthy,
          rawDetections: null,
          mode: 'offline',
        });
        setStage('completed');
        toast.success(t('scan.toast.offlineDone'));
      } catch (err) {
        setStage('failed');
        const msg =
          err instanceof Error ? err.message : t('scan.toast.offlineFailed');
        toast.error(msg);
      }
      return;
    }

    try {
      // Stage 1: Presigned URL & direct PUT upload
      setStage('uploading');
      const presigned = await apiFetch<PresignedUploadResponse>(
        '/storage/upload-url',
        {
          method: 'POST',
          body: {
            filename: selectedFile.name,
            mimeType: selectedFile.type,
            folder: 'scans',
          },
        }
      );

      const uploadResponse = await fetch(presigned.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': selectedFile.type,
        },
        body: selectedFile,
      });

      if (!uploadResponse.ok) {
        throw new Error(t('scan.toast.storageFailed', { status: uploadResponse.status }));
      }

      // Stage 2: Enqueue BullMQ job
      setStage('localizing');
      const queued = await apiFetch<QueueDiagnosisResponse>('/diagnoses/queue', {
        method: 'POST',
        body: {
          imageKey: presigned.fileKey,
          ...(attachGeo && coords
            ? { latitude: coords.lat, longitude: coords.lng }
            : {}),
        },
      });

      const diagnosisId = queued.diagnosisId || queued.id;
      if (!diagnosisId) {
        throw new Error(t('scan.toast.noId'));
      }

      // Stage 3: Poll until completion
      await pollDiagnosis(diagnosisId, previewUrl);
    } catch (err) {
      if (cancelledRef.current) return;
      setStage('failed');
      const msg =
        err instanceof ApiError || err instanceof Error
          ? err.message
          : t('scan.toast.pipelineFailed');
      toast.error(msg);
    }
  };

  const isProcessing =
    stage === 'uploading' ||
    stage === 'localizing' ||
    stage === 'classifying' ||
    stage === 'offline_running';

  const activeCloudStepIdx = CLOUD_PIPELINE_STEPS.findIndex(
    (s) => s.key === stage
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {t('scan.title')}
          </h1>
          <p className="text-sm text-slate-600">
            {t('scan.subtitle', {
              detector: MODEL_INFO.detector,
              classifier: MODEL_INFO.classifier,
              crops: MODEL_INFO.cropCount,
            })}
          </p>
        </div>

        {/* Offline Field Mode Switch */}
        <button
          type="button"
          onClick={() => setManualOffline((prev) => !prev)}
          disabled={!isOnline}
          className={cn(
            'inline-flex items-center gap-2.5 rounded-full border px-4 py-2 text-xs font-semibold transition-colors',
            offlineMode
              ? 'border-amber-300 bg-amber-50 text-amber-900'
              : 'border-emerald-200 bg-emerald-50 text-emerald-900'
          )}
        >
          {offlineMode ? (
            <>
              <WifiOff className="h-4 w-4 text-amber-600" />
              <span>
                {t('scan.modeOffline')} {!isOnline ? t('scan.modeAuto') : t('scan.modeActive')}
              </span>
            </>
          ) : (
            <>
              <Wifi className="h-4 w-4 text-emerald-600" />
              <span>{t('scan.modeCloud')}</span>
            </>
          )}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Upload & Controls */}
        <Card className="border-border lg:col-span-5">
          <CardHeader>
            <CardTitle className="text-lg">{t('scan.capture')}</CardTitle>
            <CardDescription>
              {t('scan.captureHint')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Dropzone */}
            <div
              role="button"
              tabIndex={0}
              aria-label={t('scan.dropAria')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onDragEnter={(e) => {
                e.preventDefault();
                dragDepthRef.current += 1;
                setIsDragging(true);
              }}
              onDragOver={(e) => e.preventDefault()}
              onDragLeave={() => {
                dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
                if (dragDepthRef.current === 0) setIsDragging(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                dragDepthRef.current = 0;
                setIsDragging(false);
                validateAndSelectFile(e.dataTransfer.files?.[0]);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'group relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200 ease-out outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50',
                isDragging
                  ? 'animate-drop-pulse scale-[1.02] border-emerald-500 bg-emerald-50'
                  : 'border-slate-300 bg-muted/50 hover:border-emerald-400 hover:bg-emerald-50/40'
              )}
            >
              {isDragging && (
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                  <div className="animate-scan-sweep h-1/2 w-full bg-gradient-to-b from-transparent via-emerald-200/50 to-transparent" />
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  validateAndSelectFile(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
              <div
                className={cn(
                  'relative mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 transition-transform duration-200',
                  isDragging ? '-translate-y-1 scale-110' : 'group-hover:-translate-y-0.5'
                )}
              >
                <UploadCloud className={cn('h-6 w-6', isDragging && 'animate-bounce')} />
              </div>
              <p className="relative text-sm font-semibold text-slate-800">
                {isDragging
                  ? t('scan.dropRelease')
                  : selectedFile
                    ? selectedFile.name
                    : t('scan.dropIdle')}
              </p>
              <p className="relative mt-1 text-xs text-slate-500">
                {t('scan.dropSupports')}
              </p>
              <div className="relative mt-4 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-card px-2.5 py-1 text-xs font-medium text-slate-700 shadow-xs ring-1 ring-slate-200">
                  <Camera className="h-3.5 w-3.5 text-emerald-600" />
                  {t('scan.cameraReady')}
                </span>
                {selectedFile && (
                  <span className="rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                )}
              </div>
            </div>

            {/* Sample specimens */}
            <div className="space-y-2">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <FlaskConical className="h-3.5 w-3.5 text-emerald-600" />
                {t('scan.samplesTitle')}
              </p>
              <div className="grid grid-cols-4 gap-2">
                {SAMPLE_SPECIMENS.map((sample) => {
                  const isLoading = loadingSample === sample.file;
                  const isActive = selectedFile?.name === sample.file.split('/').pop();
                  const sampleKeys = SAMPLE_TEXT_KEYS[sample.file];
                  const sampleLabel = sampleKeys ? t(sampleKeys.label) : sample.label;
                  const sampleHint = sampleKeys ? t(sampleKeys.hint) : sample.hint;
                  return (
                    <button
                      key={sample.file}
                      type="button"
                      onClick={() => void loadSample(sample)}
                      disabled={isProcessing || loadingSample !== null}
                      title={`${sampleLabel}: ${sampleHint}`}
                      className={cn(
                        'group/sample relative overflow-hidden rounded-lg border text-left transition-all duration-200 disabled:opacity-60',
                        isActive
                          ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                          : 'border-border hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md'
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={sample.file}
                        alt=""
                        loading="lazy"
                        className="aspect-square w-full object-cover transition-transform duration-300 group-hover/sample:scale-105"
                      />
                      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-1.5 pt-4 pb-1 text-[10px] leading-tight font-semibold text-white">
                        {sampleLabel}
                      </span>
                      {isLoading && (
                        <span className="absolute inset-0 flex items-center justify-center bg-white/60">
                          <Loader2 className="h-4 w-4 animate-spin text-emerald-700" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Geolocation Toggle */}
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/60 p-3.5">
              <div className="flex items-center gap-2.5">
                <MapPin
                  className={cn(
                    'h-4 w-4',
                    attachGeo ? 'text-emerald-600' : 'text-slate-400'
                  )}
                />
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {t('scan.geoTitle')}
                  </p>
                  <p className="text-xs text-slate-500">
                    {coords
                      ? `${coords.lat}, ${coords.lng}`
                      : t('scan.geoHint')}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant={attachGeo ? 'default' : 'outline'}
                size="sm"
                onClick={handleToggleGeo}
                disabled={locating || offlineMode}
                className={
                  attachGeo ? 'bg-emerald-600 hover:bg-emerald-700' : ''
                }
              >
                {locating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : attachGeo ? (
                  t('scan.geoAttached')
                ) : (
                  t('scan.geoAttach')
                )}
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                type="button"
                onClick={handleRunScan}
                disabled={!selectedFile || isProcessing}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                size="lg"
              >
                {isProcessing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                {offlineMode ? t('scan.runEdge') : t('scan.runCloud')}
              </Button>
              {selectedFile && (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={handleReset}
                  disabled={isProcessing}
                  title={t('scan.resetTitle')}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Live Multi-Stage Progress Tracker */}
            {isProcessing && (
              <div className="space-y-2.5 rounded-xl border border-border bg-muted/60 p-4 text-slate-900">
                <p className="text-xs font-semibold tracking-wider text-emerald-700 uppercase">
                  {t('scan.pipelineActive')}
                </p>
                {stage === 'offline_running' ? (
                  <div className="flex items-center gap-2.5 text-sm text-amber-800">
                    <Loader2 className="h-4 w-4 animate-spin text-amber-700" />
                    <span>
                      {t('scan.runningOffline', { classifier: MODEL_INFO.classifier })}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {CLOUD_PIPELINE_STEPS.map((step, index) => {
                      const isDone = activeCloudStepIdx > index;
                      const isCurrent = activeCloudStepIdx === index;
                      return (
                        <div
                          key={step.key}
                          className={cn(
                            'flex items-center gap-2.5 text-sm',
                            isDone
                              ? 'text-emerald-700'
                              : isCurrent
                                ? 'font-medium text-slate-900'
                                : 'text-slate-400'
                          )}
                        >
                          {isDone ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                          ) : isCurrent ? (
                            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-emerald-600" />
                          ) : (
                            <div className="h-4 w-4 shrink-0 rounded-full border border-slate-300" />
                          )}
                          <span>
                            {t(step.labelKey, {
                              detector: MODEL_INFO.detector,
                              classifier: MODEL_INFO.classifier,
                            })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Detection Canvas & Clinical Diagnosis */}
        <Card className="border-border lg:col-span-7">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-lg">
                {t('scan.viewport')}
              </CardTitle>
              <CardDescription>
                {t('scan.viewportHint')}
              </CardDescription>
            </div>
            {result && (
              <Badge
                variant="outline"
                className={cn(
                  'gap-1.5',
                  result.mode === 'cloud'
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    : 'border-amber-300 bg-amber-50 text-amber-800'
                )}
              >
                <Cpu className="h-3.5 w-3.5" />
                {result.mode === 'cloud' ? t('scan.badgeCloud') : t('scan.badgeOffline')}
              </Badge>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            {previewUrl ? (
              <div className="relative">
                <DetectionCanvas
                  imageUrl={previewUrl}
                  detections={result?.rawDetections ?? null}
                />
                {isProcessing && (
                  <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
                    <div className="animate-scan-sweep h-1/3 w-full bg-gradient-to-b from-transparent via-emerald-300/40 to-transparent" />
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-field-grid flex h-72 flex-col items-center justify-center rounded-xl border border-dashed border-border text-slate-400">
                <Camera className="mb-2 h-10 w-10 stroke-[1.5]" />
                <p className="text-sm font-medium text-slate-500">{t('scan.noSpecimen')}</p>
                <p className="mt-1 text-xs">{t('scan.noSpecimenHint')}</p>
              </div>
            )}

            {result && isUncertainResult(result.speciesName, result.diseaseName) && (
              <div className="space-y-5 rounded-xl border border-amber-200 bg-amber-50/50 p-5">
                <UncertainGuidance
                  onRetake={() => fileInputRef.current?.click()}
                  onReset={handleReset}
                />
                <div className="border-t border-amber-200/70 pt-4">
                  <ConfidenceBreakdown confidence={result.confidence} uncertain />
                </div>
              </div>
            )}

            {result && !isUncertainResult(result.speciesName, result.diseaseName) && (
              <div className="animate-in fade-in slide-in-from-bottom-1 space-y-5 rounded-xl border border-border bg-muted/60 p-5 duration-300">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                      {t('scan.detected')}
                    </p>
                    <h2 className="mt-1 text-xl font-bold text-slate-900">
                      {crop(result.speciesName)} — {condition(result.diseaseName)}
                    </h2>
                  </div>

                  <Badge
                    className={cn(
                      'gap-1.5 px-3 py-1 text-xs font-semibold',
                      result.isHealthy
                        ? 'bg-emerald-600 text-white hover:bg-emerald-600'
                        : 'bg-amber-500 text-slate-950 hover:bg-amber-500'
                    )}
                  >
                    {result.isHealthy ? (
                      <>
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {t('scan.badgeHealthy')}
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {t('scan.badgeAlert')}
                      </>
                    )}
                  </Badge>
                </div>

                <ConfidenceBreakdown confidence={result.confidence} uncertain={false} />

                {/* Consult AI Agronomist CTA */}
                <div className="border-t border-border pt-4">
                  {result.id ? (
                    <Link
                      href={`/advisor?diagnosisId=${result.id}`}
                      className={cn(
                        buttonVariants({ size: 'lg' }),
                        'w-full bg-emerald-600 hover:bg-emerald-700'
                      )}
                    >
                      <MessageSquareText className="mr-2 h-4 w-4" />
                      {t('scan.consult')}
                    </Link>
                  ) : (
                    <div className="space-y-2">
                      <Button
                        type="button"
                        size="lg"
                        disabled
                        className="w-full"
                        title={t('scan.consultNeedsCloud')}
                      >
                        <MessageSquareText className="mr-2 h-4 w-4" />
                        {t('scan.consult')}
                      </Button>
                      <p className="text-center text-xs text-slate-500">
                        {t('scan.consultNeedsCloudHint')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
