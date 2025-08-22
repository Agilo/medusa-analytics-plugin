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
import { generateColorsForData } from '../lib/utils';

type StackedBarChartProps<T extends Record<string, unknown>> = {
  data: T[] | undefined;
  xAxisDataKey: keyof T;
  lineColor?: string;
  yAxisTickFormatter?: (value: number) => string;
  useStableColors?: boolean;
  colorKeyField?: keyof T;
  dataKeys: (keyof T)[];
};

export const StackedBarChart = <T extends Record<string, unknown>>({
  data,
  xAxisDataKey,
  yAxisTickFormatter,
  useStableColors = false,
  colorKeyField,
  dataKeys,
}: StackedBarChartProps<T>) => {
  const isDark = useDarkMode();

  // Generate stable colors if requested
  const colors = React.useMemo(() => {
    if (!useStableColors || !data || !colorKeyField) {
      return [];
    }
    return generateColorsForData(data, colorKeyField, 70, isDark ? 60 : 50);
  }, [data, useStableColors, colorKeyField, isDark]);

  return (
    <ResponsiveContainer aspect={16 / 9}>
      <RechartsBarChart data={data} margin={{ left: 20 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={isDark ? '#374151' : '#E5E7EB'}
        />
        <XAxis
          dataKey={String(xAxisDataKey)}
          tick={{ fill: isDark ? '#D1D5DB' : '#6B7280' }}
          axisLine={{ stroke: isDark ? '#4B5563' : '#D1D5DB' }}
          tickLine={{ stroke: isDark ? '#4B5563' : '#D1D5DB' }}
          tickMargin={10}
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
        {dataKeys?.map((key, index) => (
          <Bar
            key={String(key)}
            dataKey={String(key)}
            stackId="a"
            fill={
              useStableColors && colors.length > 0 ? colors[index] : '#3B82F6'
            }
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};
