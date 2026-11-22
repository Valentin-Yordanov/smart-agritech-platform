'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
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
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from 'cn';
import { apiFetch, ApiError } from '@/lib/api';
import { runEdgeInference } from '@/lib/edge-inference';
import { Diagnosis, DiagnosisStatus, RawDetection } from '@/types/api';
import { DetectionCanvas } from '@/components/scan/detection-canvas';
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

function subscribeOnlineStatus(callback: () => void): () => void {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function getOnlineSnapshot(): boolean {
  return navigator.onLine;
}

function getServerOnlineSnapshot(): boolean {
  return true;
}

const CLOUD_PIPELINE_STEPS: { key: ScanStage; label: string }[] = [
  { key: 'uploading', label: '1. Uploading to Edge Storage' },
  { key: 'localizing', label: '2. Localizing Specimen & Pests via YOLOv11' },
  { key: 'classifying', label: '3. Classifying Pathogen via MobileNetV4' },
];

export default function ScanPage() {
  const isOnline = useSyncExternalStore(
    subscribeOnlineStatus,
    getOnlineSnapshot,
    getServerOnlineSnapshot
  );

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
        toast.error('Unsupported file format. Please upload JPEG, PNG, or WebP.');
        return;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast.error('Image exceeds 10MB limit. Please select a smaller file.');
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
    [previewUrl]
  );

  const handleToggleGeo = () => {
    if (attachGeo) {
      setAttachGeo(false);
      setCoords(null);
      return;
    }

    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser.');
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
        toast.success('GPS coordinates attached for outbreak mapping');
      },
      (err) => {
        setLocating(false);
        setAttachGeo(false);
        toast.error(`Location unavailable: ${err.message}`);
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
          throw new Error(polled.errorMessage || 'Cloud AI inference failed');
        }

        const normalized: Diagnosis = {
          id: polled.id,
          userId: polled.userId ?? '',
          status: polled.status,
          imageUrl: localPreviewUrl,
          speciesName: polled.speciesName ?? polled.species ?? 'Unknown Species',
          diseaseName:
            polled.diseaseName ?? polled.disease ?? 'Unknown Condition',
          confidence: polled.confidence ?? 0,
          isHealthy: polled.isHealthy ?? false,
          rawDetections: polled.rawDetections ?? null,
          latitude: polled.latitude ?? null,
          longitude: polled.longitude ?? null,
          errorMessage: polled.errorMessage ?? null,
          createdAt: polled.createdAt,
          updatedAt: polled.updatedAt ?? polled.createdAt,
        };

        setResult({
          id: normalized.id,
          imageUrl: localPreviewUrl,
          speciesName: normalized.speciesName ?? 'Unknown Species',
          diseaseName: normalized.diseaseName ?? 'Unknown Condition',
          confidence: normalized.confidence ?? 0,
          isHealthy: normalized.isHealthy ?? false,
          rawDetections: normalized.rawDetections,
          mode: 'cloud',
        });
        setStage('completed');
        toast.success('Dual-stage ONNX diagnosis completed');
        return;
      }
    },
    []
  );

  const handleRunScan = async () => {
    if (!selectedFile || !previewUrl) {
      toast.error('Please upload or capture a crop or plant image first.');
      return;
    }

    cancelledRef.current = false;
    setResult(null);

    if (offlineMode) {
      try {
        setStage('offline_running');
        const edgeRes = await runEdgeInference(selectedFile);
        if (cancelledRef.current) return;

        setResult({
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
        toast.success('Offline WASM classification complete');
      } catch (err) {
        setStage('failed');
        const msg =
          err instanceof Error ? err.message : 'Offline WASM inference failed';
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
        throw new Error(`Storage upload failed (${uploadResponse.status})`);
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
        throw new Error('Backend did not return a diagnosis ID');
      }

      // Stage 3: Poll until completion
      await pollDiagnosis(diagnosisId, previewUrl);
    } catch (err) {
      if (cancelledRef.current) return;
      setStage('failed');
      const msg =
        err instanceof ApiError || err instanceof Error
          ? err.message
          : 'Scan pipeline failed';
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
            AI Plant Scanner Studio
          </h1>
          <p className="text-sm text-slate-600">
            Dual-stage YOLOv11 + MobileNetV4 pathology diagnostics with offline
            WASM fallback
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
                Offline Field Mode {!isOnline ? '(Auto)' : '(Active)'}
              </span>
            </>
          ) : (
            <>
              <Wifi className="h-4 w-4 text-emerald-600" />
              <span>Cloud Dual-Stage Mode</span>
            </>
          )}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Upload & Controls */}
        <Card className="border-slate-200 lg:col-span-5">
          <CardHeader>
            <CardTitle className="text-lg">Specimen Capture</CardTitle>
            <CardDescription>
              Upload a high-resolution crop photo (leaves, stems, fruits, or pests; JPEG, PNG, WebP up to 10MB)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Dropzone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                validateAndSelectFile(e.dataTransfer.files?.[0]);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors',
                isDragging
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-slate-300 bg-slate-50/70 hover:border-emerald-400 hover:bg-emerald-50/40'
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => validateAndSelectFile(e.target.files?.[0])}
              />
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <UploadCloud className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-slate-800">
                {selectedFile
                  ? selectedFile.name
                  : 'Drop crop image here or click to browse'}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Supports mobile camera capture &amp; desktop drag-and-drop
              </p>
              <div className="mt-4 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-xs ring-1 ring-slate-200">
                  <Camera className="h-3.5 w-3.5 text-emerald-600" />
                  Camera Ready
                </span>
                {selectedFile && (
                  <span className="rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                )}
              </div>
            </div>

            {/* Geolocation Toggle */}
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3.5">
              <div className="flex items-center gap-2.5">
                <MapPin
                  className={cn(
                    'h-4 w-4',
                    attachGeo ? 'text-emerald-600' : 'text-slate-400'
                  )}
                />
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Geotag Outbreak Map
                  </p>
                  <p className="text-xs text-slate-500">
                    {coords
                      ? `${coords.lat}, ${coords.lng}`
                      : 'Attach GPS coordinates to PostGIS radar'}
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
                  'Attached'
                ) : (
                  'Attach GPS'
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
                {offlineMode ? 'Run Edge WASM Scan' : 'Run Cloud Diagnosis'}
              </Button>
              {selectedFile && (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={handleReset}
                  disabled={isProcessing}
                  title="Reset specimen"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Live Multi-Stage Progress Tracker */}
            {isProcessing && (
              <div className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-900">
                <p className="text-xs font-semibold tracking-wider text-emerald-700 uppercase">
                  Inference Pipeline Active
                </p>
                {stage === 'offline_running' ? (
                  <div className="flex items-center gap-2.5 text-sm text-amber-800">
                    <Loader2 className="h-4 w-4 animate-spin text-amber-700" />
                    <span>
                      Running MobileNetV4 ONNX directly in browser WASM...
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
                          <span>{step.label}</span>
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
        <Card className="border-slate-200 lg:col-span-7">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-lg">
                Diagnostic Viewport &amp; Telemetry
              </CardTitle>
              <CardDescription>
                Bounding box localization and pathogen confidence scoring
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
                {result.mode === 'cloud'
                  ? 'Cloud Dual-Stage ONNX'
                  : 'Browser WASM Offline'}
              </Badge>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            {previewUrl ? (
              <DetectionCanvas
                imageUrl={previewUrl}
                detections={result?.rawDetections ?? null}
              />
            ) : (
              <div className="flex h-72 flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-100/70 text-slate-400">
                <Camera className="mb-2 h-10 w-10 stroke-[1.5]" />
                <p className="text-sm font-medium">No specimen loaded</p>
              </div>
            )}

            {result && (
              <div className="space-y-5 rounded-xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                      Detected Crop &amp; Pathology
                    </p>
                    <h2 className="mt-1 text-xl font-bold text-slate-900">
                      {result.speciesName} — {result.diseaseName}
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
                        Healthy Foliage
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Pathogen Alert
                      </>
                    )}
                  </Badge>
                </div>

                {/* Confidence Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                    <span>Model Confidence</span>
                    <span className="font-bold text-slate-900">
                      {(result.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        result.isHealthy ? 'bg-emerald-600' : 'bg-amber-500'
                      )}
                      style={{
                        width: `${Math.min(100, Math.max(0, result.confidence * 100))}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Consult AI Agronomist CTA */}
                <div className="border-t border-slate-200 pt-4">
                  {result.id ? (
                    <Link
                      href={`/advisor?diagnosisId=${result.id}`}
                      className={cn(
                        buttonVariants({ size: 'lg' }),
                        'w-full bg-emerald-600 hover:bg-emerald-700'
                      )}
                    >
                      <MessageSquareText className="mr-2 h-4 w-4" />
                      Consult AI Agronomist about this scan
                    </Link>
                  ) : (
                    <div className="space-y-2">
                      <Button
                        type="button"
                        size="lg"
                        disabled
                        className="w-full"
                        title="Cloud diagnosis required for RAG consultation"
                      >
                        <MessageSquareText className="mr-2 h-4 w-4" />
                        Consult AI Agronomist about this scan
                      </Button>
                      <p className="text-center text-xs text-slate-500">
                        RAG Agronomic Advisor requires an online cloud diagnosis
                        ID. Reconnect and run Cloud Diagnosis to link this scan.
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
