import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { TrendingUp, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { JobApplication } from '../types';
import { useTheme } from '../context/ThemeContext';

interface ApplicationsTrendChartProps {
  jobs: JobApplication[];
}

interface MonthlyDataPoint {
  monthKey: string; // "2026-03"
  label: string; // "Mar 2026"
  shortLabel: string; // "Mar"
  count: number;
  appliedCount: number;
  interviewCount: number;
  offerCount: number;
}

export const ApplicationsTrendChart: React.FC<ApplicationsTrendChartProps> = ({ jobs }) => {
  const { isDark } = useTheme();

  const chartData = useMemo(() => {
    const now = new Date();
    const result: MonthlyDataPoint[] = [];

    // Generate the last 6 months in chronological order
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth(); // 0-11
      const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const shortLabel = d.toLocaleDateString('en-US', { month: 'short' });

      result.push({
        monthKey,
        label,
        shortLabel,
        count: 0,
        appliedCount: 0,
        interviewCount: 0,
        offerCount: 0,
      });
    }

    // Map each job to its respective month
    jobs.forEach((job) => {
      // Use appliedDate if present, fallback to createdAt
      const rawDate = job.appliedDate || job.createdAt;
      if (!rawDate) return;

      const datePart = rawDate.slice(0, 7); // "YYYY-MM"
      const match = result.find((item) => item.monthKey === datePart);
      if (match) {
        match.count += 1;
        if (job.status === 'Applied') match.appliedCount += 1;
        if (job.status === 'Interviewing' || job.status === 'Screening' || job.status === 'Assessment') {
          match.interviewCount += 1;
        }
        if (job.status === 'Offer') match.offerCount += 1;
      }
    });

    return result;
  }, [jobs]);

  // Derived statistics for the last 6 months
  const totalLast6Months = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.count, 0);
  }, [chartData]);

  const peakMonth = useMemo(() => {
    if (chartData.length === 0) return { label: '—', shortLabel: '—', count: 0 };
    return chartData.reduce((max, curr) => (curr.count > max.count ? curr : max), chartData[0]);
  }, [chartData]);

  const monthlyAverage = useMemo(() => {
    return (totalLast6Months / (chartData.length || 1)).toFixed(1);
  }, [totalLast6Months, chartData.length]);

  const monthOverMonthChange = useMemo(() => {
    if (chartData.length < 2) return 0;
    const currentMonth = chartData[chartData.length - 1].count;
    const prevMonth = chartData[chartData.length - 2].count;
    if (prevMonth === 0) return currentMonth > 0 ? 100 : 0;
    return Math.round(((currentMonth - prevMonth) / prevMonth) * 100);
  }, [chartData]);

  const maxVal = Math.max(...chartData.map((d) => d.count), 4);
  // Give YAxis headroom
  const yDomainMax = Math.ceil(maxVal * 1.25);

  const gridStroke = isDark ? '#334155' : '#e2e8f0';
  const axisColor = isDark ? '#94a3b8' : '#64748b';
  const axisLineColor = isDark ? '#334155' : '#cbd5e1';

  return (
    <div
      id="applications-trend-chart"
      className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 transition-all hover:border-slate-300 dark:hover:border-slate-700/80 shadow-xs"
    >
      {/* Header & Metric Summary Bento row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                Applications per Month
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Application saving and submission trend over the last 6 months
              </p>
            </div>
          </div>
        </div>

        {/* Quick KPI stats pill grid */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 px-3 py-1.5 rounded-xl">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 block">
              6-Mo Total
            </span>
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {totalLast6Months} apps
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 px-3 py-1.5 rounded-xl">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 block">
              Monthly Avg
            </span>
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {monthlyAverage}/mo
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 px-3 py-1.5 rounded-xl">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 block">
              Peak Month
            </span>
            <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
              {peakMonth.shortLabel} ({peakMonth.count})
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 block">
                MoM Pace
              </span>
              <div className="flex items-center gap-0.5">
                {monthOverMonthChange >= 0 ? (
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                )}
                <span
                  className={`text-sm font-semibold ${
                    monthOverMonthChange >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {monthOverMonthChange > 0 ? `+${monthOverMonthChange}%` : `${monthOverMonthChange}%`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="mt-5 h-64 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 12, right: 12, left: -20, bottom: 4 }}
          >
            <defs>
              {/* Vibrant Indigo-to-transparent gradient fill */}
              <linearGradient id="indigoGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={isDark ? 0.4 : 0.25} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke={gridStroke}
              strokeOpacity={0.7}
              vertical={false}
            />

            <XAxis
              dataKey="shortLabel"
              stroke={axisColor}
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: axisLineColor, strokeWidth: 1 }}
              tick={{ fill: axisColor }}
              dy={6}
            />

            <YAxis
              stroke={axisColor}
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: axisLineColor, strokeWidth: 1 }}
              tick={{ fill: axisColor }}
              allowDecimals={false}
              domain={[0, yDomainMax]}
              dx={-4}
            />

            <Tooltip
              content={<CustomChartTooltip isDark={isDark} />}
              cursor={{
                stroke: '#6366f1',
                strokeWidth: 1.5,
                strokeDasharray: '4 4',
              }}
            />

            {/* Glowing trend Area and Line */}
            <Area
              type="monotone"
              dataKey="count"
              stroke="#6366f1"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#indigoGradient)"
              activeDot={{
                r: 6,
                fill: '#818cf8',
                stroke: '#ffffff',
                strokeWidth: 2,
                className: 'drop-shadow-md',
              }}
              dot={{
                r: 4,
                fill: '#6366f1',
                stroke: isDark ? '#0f172a' : '#ffffff',
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer timeline legend */}
      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block shadow-xs shadow-indigo-500" />
          <span>Tracked & Saved Applications</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
          <Calendar className="w-3.5 h-3.5" />
          <span>Last 6 Calendar Months</span>
        </div>
      </div>
    </div>
  );
};

// Custom Bento Tooltip Component
const CustomChartTooltip: React.FC<any> = ({ active, payload, isDark }) => {
  if (active && payload && payload.length > 0) {
    const data: MonthlyDataPoint = payload[0].payload;
    return (
      <div className="bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-xl text-xs space-y-1.5 min-w-[170px]">
        <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-1.5">
          <span>{data.label}</span>
          <span className="text-[11px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-transparent">
            {data.count} {data.count === 1 ? 'Job' : 'Jobs'}
          </span>
        </div>
        <div className="space-y-1 pt-0.5 text-slate-600 dark:text-slate-300">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">Submitted:</span>
            <span className="font-medium text-slate-800 dark:text-slate-200">{data.appliedCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">Interviews/Loops:</span>
            <span className="font-medium text-indigo-600 dark:text-indigo-400">{data.interviewCount}</span>
          </div>
          {data.offerCount > 0 && (
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
              <span>Offers:</span>
              <span>{data.offerCount}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

