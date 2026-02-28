import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useDarkMode } from '../hooks/use-dark-mode';
import { generateColorsForData } from '../lib/utils';
import { ValueType } from 'recharts/types/component/DefaultTooltipContent';

type BarChartProps<T extends Record<string, unknown>> = {
  data: T[] | undefined;
  xAxisDataKey: keyof T;
  yAxisDataKey: keyof T;
  lineColor?: string;
  yAxisTickFormatter?: (value: ValueType | undefined) => string;
  isHorizontal?: boolean;
  useStableColors?: boolean;
  colorKeyField?: keyof T;
  hideTooltip?: boolean;
};

export const BarChart = <T extends Record<string, unknown>>({
  data,
  xAxisDataKey,
  yAxisDataKey,
  lineColor = '#3B82F6',
  yAxisTickFormatter,
  useStableColors = false,
  colorKeyField,
  isHorizontal = false,
  hideTooltip = false,
}: BarChartProps<T>) => {
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
      <RechartsBarChart
        data={data}
        margin={{ left: 20 }}
        layout={isHorizontal ? 'vertical' : 'horizontal'}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={isDark ? '#374151' : '#E5E7EB'}
        />
        <XAxis
          type={isHorizontal ? 'number' : 'category'}
          dataKey={!isHorizontal ? String(xAxisDataKey) : undefined}
          tick={{ fill: isDark ? '#D1D5DB' : '#6B7280' }}
          axisLine={{ stroke: isDark ? '#4B5563' : '#D1D5DB' }}
          tickLine={{ stroke: isDark ? '#4B5563' : '#D1D5DB' }}
          tickMargin={10}
        />
        <YAxis
          type={isHorizontal ? 'category' : 'number'}
          dataKey={isHorizontal ? String(xAxisDataKey) : undefined}
          tickFormatter={yAxisTickFormatter}
          allowDecimals={false}
          tick={{ fill: isDark ? '#D1D5DB' : '#6B7280' }}
          axisLine={{ stroke: isDark ? '#4B5563' : '#D1D5DB' }}
          tickLine={{ stroke: isDark ? '#4B5563' : '#D1D5DB' }}
        />
        {!hideTooltip && (
          <Tooltip
            cursor={{
              fill: isDark
                ? 'rgba(55, 65, 81, 0.2)'
                : 'rgba(243, 244, 246, 0.5)',
            }}
            formatter={yAxisTickFormatter ? yAxisTickFormatter : undefined}
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
        )}
        <Bar dataKey={String(yAxisDataKey)} fill={lineColor}>
          {useStableColors && colors.length > 0
            ? data?.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index]} />
              ))
            : null}
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};
