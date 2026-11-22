'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  MapPin,
  Search,
  AlertTriangle,
  ShieldAlert,
  Activity,
  RefreshCw,
  ScanLine,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from 'cn';
import { apiFetch, ApiError } from '@/lib/api';
import type { OutbreakPoint } from '@/components/map/outbreak-map';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const OutbreakMap = dynamic(() => import('@/components/map/outbreak-map'), {
  ssr: false,
  loading: () => <Skeleton className="h-[520px] w-full rounded-xl" />,
});

interface BackendOutbreakItem {
  id: string;
  speciesName: string;
  diseaseName: string;
  confidence: number;
  isHealthy?: boolean;
  latitude: number;
  longitude: number;
  createdAt: string;
  severity?: string;
}

interface BackendOutbreaksResponse {
  totalOutbreaks: number;
  outbreaks: BackendOutbreakItem[];
}

interface GeoJsonFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: {
    id: string;
    speciesName?: string;
    diseaseName?: string;
    confidence?: number;
    isHealthy?: boolean;
    createdAt?: string;
    severity?: string;
  };
}

interface GeoJsonFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJsonFeature[];
}

function normalizeOutbreakPayload(
  payload: BackendOutbreaksResponse | GeoJsonFeatureCollection
): OutbreakPoint[] {
  if ('features' in payload && Array.isArray(payload.features)) {
    return payload.features
      .filter(
        (f) =>
          f.geometry?.type === 'Point' &&
          Array.isArray(f.geometry.coordinates) &&
          f.geometry.coordinates.length === 2
      )
      .map((f) => ({
        id: f.properties.id,
        speciesName: f.properties.speciesName ?? 'Unknown Crop',
        diseaseName: f.properties.diseaseName ?? 'Pathology Alert',
        confidence: f.properties.confidence ?? 0,
        isHealthy: f.properties.isHealthy ?? false,
        longitude: f.geometry.coordinates[0],
        latitude: f.geometry.coordinates[1],
        createdAt: f.properties.createdAt ?? new Date().toISOString(),
        severity: f.properties.severity,
      }));
  }

  if ('outbreaks' in payload && Array.isArray(payload.outbreaks)) {
    return payload.outbreaks.map((item) => ({
      id: item.id,
      speciesName: item.speciesName,
      diseaseName: item.diseaseName,
      confidence: item.confidence,
      isHealthy: item.isHealthy ?? false,
      latitude: item.latitude,
      longitude: item.longitude,
      createdAt: item.createdAt,
      severity: item.severity,
    }));
  }

  return [];
}

export default function OutbreaksPage() {
  const [points, setPoints] = useState<OutbreakPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let active = true;
    const loadOutbreaks = async () => {
      setLoading(true);
      try {
        const res = await apiFetch<
          BackendOutbreaksResponse | GeoJsonFeatureCollection
        >('/diagnoses/outbreaks');
        if (active) {
          setPoints(normalizeOutbreakPayload(res));
        }
      } catch (err) {
        if (active) {
          const msg =
            err instanceof ApiError
              ? err.message
              : 'Failed to load geospatial outbreak radar';
          toast.error(msg);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    void loadOutbreaks();
    return () => {
      active = false;
    };
  }, [refreshTick]);

  const filteredPoints = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return points.filter((pt) => {
      if (activeOnly && pt.isHealthy) return false;
      if (!q) return true;
      return (
        pt.speciesName.toLowerCase().includes(q) ||
        pt.diseaseName.toLowerCase().includes(q)
      );
    });
  }, [points, searchQuery, activeOnly]);

  const telemetry = useMemo(() => {
    const activeAlerts = points.filter((p) => !p.isHealthy);
    const threatCounts = new Map<string, number>();

    for (const pt of activeAlerts) {
      const key = `${pt.speciesName} — ${pt.diseaseName}`;
      threatCounts.set(key, (threatCounts.get(key) ?? 0) + 1);
    }

    const topThreats = Array.from(threatCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      totalScans: points.length,
      activeAlertsCount: activeAlerts.length,
      topThreats,
    };
  }, [points]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
            <MapPin className="h-6 w-6 text-emerald-600" />
            Epidemiological Outbreak Radar
          </h1>
          <p className="text-sm text-slate-600">
            Live PostGIS geospatial monitoring of geotagged crop pathology
            detections across Bulgaria
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setRefreshTick((t) => t + 1)}
          disabled={loading}
        >
          <RefreshCw
            className={cn('mr-2 h-4 w-4', loading && 'animate-spin')}
          />
          Refresh Radar
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter pins by crop species or disease (e.g., Tomato, Late Blight)..."
            className="pl-10"
          />
        </div>

        <Button
          type="button"
          variant={activeOnly ? 'default' : 'outline'}
          onClick={() => setActiveOnly((prev) => !prev)}
          className={cn(
            'shrink-0',
            activeOnly && 'bg-red-600 text-white hover:bg-red-700'
          )}
        >
          <ShieldAlert className="mr-2 h-4 w-4" />
          {activeOnly
            ? 'Showing Pathogen Alerts Only'
            : 'Active Pathogen Alerts Only'}
        </Button>

        {(searchQuery || activeOnly) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setActiveOnly(false);
            }}
            className="shrink-0 text-slate-600"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Map + Telemetry Sidebar */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Map Container */}
        <Card className="overflow-hidden border-slate-200 lg:col-span-8">
          <CardContent className="h-[540px] p-0">
            {loading ? (
              <Skeleton className="h-full w-full rounded-none" />
            ) : (
              <OutbreakMap points={filteredPoints} />
            )}
          </CardContent>
        </Card>

        {/* Side Telemetry Summary Panel */}
        <div className="space-y-4 lg:col-span-4">
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4 text-emerald-600" />
                Regional Telemetry
              </CardTitle>
              <CardDescription>
                Aggregated from geotagged field scans
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-medium text-slate-500">
                  Geotagged Scans
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {telemetry.totalScans}
                </p>
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50/60 p-3">
                <p className="text-xs font-medium text-red-700">
                  Active Alerts
                </p>
                <p className="mt-1 text-2xl font-bold text-red-700">
                  {telemetry.activeAlertsCount}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Top Regional Threats
              </CardTitle>
            </CardHeader>
            <CardContent>
              {telemetry.topThreats.length === 0 ? (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">
                    No active pathogen outbreaks recorded yet. Geotag a scan in
                    the AI Scanner Studio to populate the radar.
                  </p>
                  <Link
                    href="/scan"
                    className={cn(
                      buttonVariants({ size: 'sm', variant: 'outline' }),
                      'w-full gap-1.5'
                    )}
                  >
                    <ScanLine className="h-3.5 w-3.5" />
                    Scan &amp; Geotag a Specimen
                  </Link>
                </div>
              ) : (
                <ul className="space-y-2.5">
                  {telemetry.topThreats.map(([name, count]) => (
                    <li
                      key={name}
                      className="flex items-center justify-between gap-2 text-xs"
                    >
                      <span className="truncate font-medium text-slate-800">
                        {name}
                      </span>
                      <Badge
                        variant="outline"
                        className="shrink-0 border-red-200 bg-red-50 text-red-700"
                      >
                        {count} {count === 1 ? 'case' : 'cases'}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Marker Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-500 ring-2 ring-red-700/40" />
                <span>Confirmed Pathogen (&ge; 70% confidence)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-amber-500 ring-2 ring-amber-700/40" />
                <span>Low-Confidence Alert (&lt; 70% confidence)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-emerald-700/40" />
                <span>Healthy Baseline Check</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
