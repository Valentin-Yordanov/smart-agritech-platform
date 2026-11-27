'use client';

import Link from 'next/link';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useI18n } from '@/i18n/language-provider';
import type { MessageKey } from '@/i18n/messages';

export interface OutbreakPoint {
  id: string;
  speciesName: string;
  diseaseName: string;
  confidence: number;
  isHealthy: boolean;
  latitude: number;
  longitude: number;
  createdAt: string;
  severity?: string;
}

interface OutbreakMapProps {
  points: OutbreakPoint[];
}

const BULGARIA_CENTER: [number, number] = [42.7339, 25.4858];

function getMarkerStyle(point: OutbreakPoint): {
  color: string;
  fillColor: string;
  labelKey: MessageKey;
} {
  if (point.isHealthy) {
    return {
      color: '#047857',
      fillColor: '#10b981',
      labelKey: 'map.healthy',
    };
  }
  if (point.confidence < 0.7) {
    return {
      color: '#b45309',
      fillColor: '#f59e0b',
      labelKey: 'map.low',
    };
  }
  return {
    color: '#b91c1c',
    fillColor: '#ef4444',
    labelKey: 'map.confirmed',
  };
}

export default function OutbreakMap({ points }: OutbreakMapProps) {
  const { t, lang, crop, condition } = useI18n();

  return (
    <MapContainer
      center={BULGARIA_CENTER}
      zoom={7}
      scrollWheelZoom={true}
      className="z-0 h-full w-full rounded-xl"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {points.map((point) => {
        const style = getMarkerStyle(point);
        return (
          <CircleMarker
            key={point.id}
            center={[point.latitude, point.longitude]}
            radius={9}
            pathOptions={{
              color: style.color,
              fillColor: style.fillColor,
              fillOpacity: 0.8,
              weight: 2,
            }}
          >
            <Popup>
              <div className="min-w-[210px] space-y-2 p-0.5 text-slate-900">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                    style={{ backgroundColor: style.fillColor }}
                  >
                    {t(style.labelKey)}
                  </span>
                  <span className="text-[11px] font-medium text-slate-500">
                    {(point.confidence * 100).toFixed(1)}%
                  </span>
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {crop(point.speciesName)}
                  </p>
                  <p className="text-xs font-medium text-slate-700">
                    {condition(point.diseaseName)}
                  </p>
                </div>

                <p className="text-[11px] text-slate-500">
                  {t('map.detected')}{' '}
                  {new Date(point.createdAt).toLocaleString(lang === 'bg' ? 'bg-BG' : 'en-GB', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>

                <Link
                  href={`/advisor?diagnosisId=${point.id}`}
                  className="inline-block text-xs font-semibold text-emerald-700 hover:underline"
                >
                  {t('map.consult')}
                </Link>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
