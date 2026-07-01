'use client';

import dynamic from 'next/dynamic';
import { CalcSkeleton } from '@/components/calculators/shared/CalcSkeleton';

const LazyPie = dynamic(() => import('./charts/PieChartInner').then((m) => m.PieChartInner), {
  ssr: false,
  loading: () => <CalcSkeleton className="h-48 w-full" />,
});

const LazyLine = dynamic(() => import('./charts/LineChartInner').then((m) => m.LineChartInner), {
  ssr: false,
  loading: () => <CalcSkeleton className="h-56 w-full" />,
});

const LazyBar = dynamic(() => import('./charts/BarChartInner').then((m) => m.BarChartInner), {
  ssr: false,
  loading: () => <CalcSkeleton className="h-56 w-full" />,
});

export { LazyPie as CalcPieChart, LazyLine as CalcLineChart, LazyBar as CalcBarChart };