'use client';

import { useCallback, useEffect, useRef } from 'react';
import { RawDetection } from '@/types/api';
import { useI18n } from '@/i18n/language-provider';

interface DetectionCanvasProps {
  imageUrl: string;
  detections: RawDetection[] | null;
  alt?: string;
}

export function DetectionCanvas({
  imageUrl,
  detections,
  alt,
}: DetectionCanvasProps) {
  const { t, crop, condition } = useI18n();
  const imgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const drawDetections = useCallback(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    const displayWidth = img.clientWidth;
    const displayHeight = img.clientHeight;
    if (displayWidth === 0 || displayHeight === 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(displayWidth * dpr);
    canvas.height = Math.round(displayHeight * dpr);
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, displayWidth, displayHeight);

    if (!detections || detections.length === 0) return;

    const naturalWidth = img.naturalWidth || displayWidth;
    const naturalHeight = img.naturalHeight || displayHeight;

    for (const det of detections) {
      if (!Array.isArray(det.bbox) || det.bbox.length !== 4) continue;
      const [rawX1, rawY1, rawX2, rawY2] = det.bbox;

      // Support both normalized [0..1] and pixel coordinates
      const isNormalized =
        rawX2 <= 1 && rawY2 <= 1 && rawX1 >= 0 && rawY1 >= 0;

      const x1 = isNormalized
        ? rawX1 * displayWidth
        : (rawX1 / naturalWidth) * displayWidth;
      const y1 = isNormalized
        ? rawY1 * displayHeight
        : (rawY1 / naturalHeight) * displayHeight;
      const x2 = isNormalized
        ? rawX2 * displayWidth
        : (rawX2 / naturalWidth) * displayWidth;
      const y2 = isNormalized
        ? rawY2 * displayHeight
        : (rawY2 / naturalHeight) * displayHeight;

      const boxW = Math.max(1, x2 - x1);
      const boxH = Math.max(1, y2 - y1);

      const isHealthy = det.is_healthy === true;
      const strokeColor = isHealthy ? '#10b981' : '#f59e0b';
      const fillColor = isHealthy
        ? 'rgba(16, 185, 129, 0.12)'
        : 'rgba(245, 158, 11, 0.14)';

      // Bounding box fill & stroke
      ctx.fillStyle = fillColor;
      ctx.fillRect(x1, y1, boxW, boxH);

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = strokeColor;
      ctx.strokeRect(x1, y1, boxW, boxH);

      // Corner accents for crisp HUD aesthetic
      const cornerLen = Math.min(14, boxW * 0.25, boxH * 0.25);
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      // Top-left
      ctx.moveTo(x1, y1 + cornerLen);
      ctx.lineTo(x1, y1);
      ctx.lineTo(x1 + cornerLen, y1);
      // Top-right
      ctx.moveTo(x2 - cornerLen, y1);
      ctx.lineTo(x2, y1);
      ctx.lineTo(x2, y1 + cornerLen);
      // Bottom-right
      ctx.moveTo(x2, y2 - cornerLen);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x2 - cornerLen, y2);
      // Bottom-left
      ctx.moveTo(x1 + cornerLen, y2);
      ctx.lineTo(x1, y2);
      ctx.lineTo(x1, y2 - cornerLen);
      ctx.stroke();

      // Confidence badge label
      const namePart =
        det.disease && det.disease !== 'None'
          ? condition(det.disease)
          : det.species
            ? crop(det.species)
            : det.class_name || t('scan.specimen');
      const confPct = `${(det.confidence * 100).toFixed(1)}%`;
      const label = `${namePart} · ${confPct}`;

      ctx.font = '600 12px Inter, system-ui, sans-serif';
      const textMetrics = ctx.measureText(label);
      const padX = 8;
      const badgeH = 22;
      const badgeW = textMetrics.width + padX * 2;
      const badgeX = Math.max(0, Math.min(x1, displayWidth - badgeW));
      const badgeY = y1 - badgeH - 4 >= 0 ? y1 - badgeH - 4 : y1 + 4;

      ctx.fillStyle = strokeColor;
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 6);
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, badgeX + padX, badgeY + badgeH / 2);
    }
  }, [detections, t, crop, condition]);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    drawDetections();

    const observer = new ResizeObserver(() => {
      drawDetections();
    });
    observer.observe(img);

    window.addEventListener('resize', drawDetections);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', drawDetections);
    };
  }, [drawDetections, imageUrl]);

  return (
    <div className="relative flex w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-slate-950">
      <div className="relative inline-block max-w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={imageUrl}
          alt={alt ?? t('scan.altImage')}
          onLoad={drawDetections}
          className="block max-h-115 w-auto max-w-full object-contain select-none"
        />
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0 h-full w-full"
        />
      </div>
    </div>
  );
}
