'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import L from 'leaflet';
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
const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

function getMarkerStyle(point: OutbreakPoint): {
  color: string;
  fillColor: string;
  labelKey: MessageKey;
} {
  if (point.isHealthy) {
    return { color: '#047857', fillColor: '#10b981', labelKey: 'map.healthy' };
  }
  if (point.confidence < 0.7) {
    return { color: '#b45309', fillColor: '#f59e0b', labelKey: 'map.low' };
  }
  return { color: '#b91c1c', fillColor: '#ef4444', labelKey: 'map.confirmed' };
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export default function OutbreakMap({ points }: OutbreakMapProps) {
  const { t, lang, crop, condition } = useI18n();
  const router = useRouter();
  const holderRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [mapVersion, setMapVersion] = useState(0);

  // Markers are declared before the map effect so their cleanup runs while the map is still alive
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const group = L.layerGroup().addTo(map);
    for (const point of points) {
      const style = getMarkerStyle(point);

      // Popup is built with textContent only, so API strings can never inject HTML
      const popup = () => {
        const root = el('div', 'min-w-[210px] space-y-2 p-0.5 text-slate-900');
        const head = el('div', 'flex items-center justify-between gap-2');
        const badge = el('span', 'inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold text-white', t(style.labelKey));
        badge.style.backgroundColor = style.fillColor;
        head.append(badge, el('span', 'text-[11px] font-medium text-slate-500', `${(point.confidence * 100).toFixed(1)}%`));

        const body = el('div', '');
        body.append(
          el('p', 'text-sm font-bold text-slate-900', crop(point.speciesName)),
          el('p', 'text-xs font-medium text-slate-700', condition(point.diseaseName))
        );

        const when = new Date(point.createdAt).toLocaleString(lang === 'bg' ? 'bg-BG' : 'en-GB', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        const detected = el('p', 'text-[11px] text-slate-500', `${t('map.detected')} ${when}`);

        const href = `/advisor?diagnosisId=${encodeURIComponent(point.id)}`;
        const link = el('a', 'inline-block text-xs font-semibold text-emerald-700 hover:underline', t('map.consult'));
        link.href = href;
        link.addEventListener('click', (event) => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
          event.preventDefault();
          router.push(href);
        });

        root.append(head, body, detected, link);
        return root;
      };

      L.circleMarker([point.latitude, point.longitude], {
        radius: 9,
        color: style.color,
        fillColor: style.fillColor,
        fillOpacity: 0.8,
        weight: 2,
      })
        .bindPopup(popup)
        .addTo(group);
    }

    return () => {
      group.remove();
    };
  }, [mapVersion, points, t, lang, crop, condition, router]);

  // A fresh container element per mount means Strict Mode or cached-route remounts never reuse a Leaflet container
  useEffect(() => {
    const holder = holderRef.current;
    if (!holder) return;

    const container = el('div', 'h-full w-full');
    holder.appendChild(container);

    const map = L.map(container, { scrollWheelZoom: true }).setView(BULGARIA_CENTER, 7);
    L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION }).addTo(map);
    mapRef.current = map;
    setMapVersion((v) => v + 1);

    // Card size can settle after mount; keep tiles aligned with the real box
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(holder);

    return () => {
      observer.disconnect();
      mapRef.current = null;
      map.remove();
      container.remove();
    };
  }, []);

  return <div ref={holderRef} className="relative z-0 h-full w-full overflow-hidden rounded-xl" />;
}
