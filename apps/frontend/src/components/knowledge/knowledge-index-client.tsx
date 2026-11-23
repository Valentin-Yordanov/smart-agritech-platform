'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, ArrowRight, AlertTriangle, Sprout } from 'lucide-react';
import { cn } from 'cn';
import { AgronomyGuide, PathogenCategory } from '@/data/knowledge-base';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface KnowledgeIndexClientProps {
  guides: AgronomyGuide[];
}

const CATEGORIES: Array<'All' | PathogenCategory> = [
  'All',
  'Fungal',
  'Oomycete',
  'Bacterial / Pest',
  'Viral',
];

export function KnowledgeIndexClient({ guides }: KnowledgeIndexClientProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<
    'All' | PathogenCategory
  >('All');

  const filteredGuides = useMemo(() => {
    const q = search.trim().toLowerCase();
    return guides.filter((guide) => {
      if (
        selectedCategory !== 'All' &&
        guide.pathogenType !== selectedCategory
      ) {
        return false;
      }
      if (!q) return true;
      return (
        guide.title.toLowerCase().includes(q) ||
        guide.hostCrop.toLowerCase().includes(q) ||
        guide.scientificName.toLowerCase().includes(q) ||
        guide.summary.toLowerCase().includes(q)
      );
    });
  }, [guides, search, selectedCategory]);

  return (
    <div className="space-y-6">
      {/* Search & Filter Controls */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by crop, pathogen, or scientific name (e.g., Alternaria, Grapevine)..."
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((category) => {
            const active = selectedCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  'rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors',
                  active
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                )}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>

      {/* Guide Cards Grid */}
      {filteredGuides.length === 0 ? (
        <Card className="border-slate-200 py-12 text-center">
          <CardContent className="space-y-3">
            <p className="text-base font-semibold text-slate-800">
              No matching pathology guides
            </p>
            <p className="text-sm text-slate-500">
              Try clearing your filter or searching for another crop species.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('');
                setSelectedCategory('All');
              }}
            >
              Reset Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredGuides.map((guide) => (
            <Link
              key={guide.slug}
              href={`/knowledge/${guide.slug}`}
              className="group block h-full"
            >
              <Card className="flex h-full flex-col border-slate-200 transition-colors group-hover:border-emerald-300">
                <CardHeader className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      variant="outline"
                      className="border-emerald-200 bg-emerald-50 text-[11px] font-semibold text-emerald-800"
                    >
                      <Sprout className="mr-1 h-3 w-3" />
                      {guide.hostCrop}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[11px] font-semibold',
                        guide.severityRisk === 'Critical'
                          ? 'border-red-200 bg-red-50 text-red-700'
                          : guide.severityRisk === 'High'
                            ? 'border-amber-200 bg-amber-50 text-amber-800'
                            : 'border-slate-200 bg-slate-100 text-slate-700'
                      )}
                    >
                      <AlertTriangle className="mr-1 h-3 w-3" />
                      {guide.severityRisk} Risk
                    </Badge>
                  </div>

                  <CardTitle className="text-lg text-slate-900 group-hover:text-emerald-700">
                    {guide.title}
                  </CardTitle>
                  <p className="text-xs font-medium italic text-slate-500">
                    {guide.scientificName} &middot; {guide.pathogenType}
                  </p>
                </CardHeader>

                <CardContent className="flex-1">
                  <CardDescription className="line-clamp-3 text-sm leading-relaxed text-slate-600">
                    {guide.summary}
                  </CardDescription>
                </CardContent>

                <CardFooter className="border-t border-slate-100 pt-3 text-xs font-semibold text-emerald-700">
                  <span className="inline-flex items-center gap-1.5 transition-transform group-hover:translate-x-0.5">
                    Read IPM Protocol
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
