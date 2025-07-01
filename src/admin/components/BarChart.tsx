import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useDarkMode } from '../hooks/use-dark-mode';

type BarChartProps = {
  data: any[] | undefined;
  xAxisDataKey: string;
  yAxisDataKey: string;
  lineColor?: string;
  yAxisTickFormatter?: (value: number) => string;
};

export const BarChart: React.FC<BarChartProps> = ({
  data,
  xAxisDataKey,
  yAxisDataKey,
  lineColor = '#3B82F6',
  yAxisTickFormatter,
}) => {
  const isDark = useDarkMode();

  return (
    <ResponsiveContainer aspect={16 / 9}>
      <RechartsBarChart data={data}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={isDark ? '#374151' : '#E5E7EB'}
        />
        <XAxis
          dataKey={xAxisDataKey}
          tick={{ fill: isDark ? '#D1D5DB' : '#6B7280' }}
          axisLine={{ stroke: isDark ? '#4B5563' : '#D1D5DB' }}
          tickLine={{ stroke: isDark ? '#4B5563' : '#D1D5DB' }}
        />
        <YAxis
          tickFormatter={yAxisTickFormatter}
          allowDecimals={false}
          tick={{ fill: isDark ? '#D1D5DB' : '#6B7280' }}
          axisLine={{ stroke: isDark ? '#4B5563' : '#D1D5DB' }}
          tickLine={{ stroke: isDark ? '#4B5563' : '#D1D5DB' }}
        />
        <Tooltip
          cursor={{
            fill: isDark ? 'rgba(55, 65, 81, 0.2)' : 'rgba(243, 244, 246, 0.5)',
          }}
          formatter={(value: number) =>
            yAxisTickFormatter ? yAxisTickFormatter(value) : value
          }
          contentStyle={{
            backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
            border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
            borderRadius: '0.5rem',
            color: isDark ? '#F9FAFB' : '#111827',
            boxShadow: isDark
              ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
              : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
          labelStyle={{
            color: isDark ? '#F9FAFB' : '#111827',
            fontWeight: '500',
            marginBottom: '4px',
          }}
        />
        <Bar dataKey={yAxisDataKey} fill={lineColor} />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};
