import React from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
} from 'recharts';
import { useDarkMode } from '../hooks/use-dark-mode';
import { ValueType } from 'recharts/types/component/DefaultTooltipContent';

type LineChartProps = {
  data: any[] | undefined;
  xAxisDataKey: string;
  yAxisDataKey?: string;
  lineColor?: string;
  series?: { dataKey: string; color?: string }[];
  yAxisTickFormatter?: (value: ValueType | undefined) => string;
  hideTooltip?: boolean;
};

export const LineChart: React.FC<LineChartProps> = ({
  data,
  xAxisDataKey,
  yAxisDataKey,
  lineColor = '#3B82F6',
  series,
  yAxisTickFormatter,
  hideTooltip = false,
}) => {
  const isDark = useDarkMode();

  const resolvedSeries =
    series && series.length > 0
      ? series
      : yAxisDataKey
        ? [{ dataKey: yAxisDataKey, color: lineColor }]
        : [];

  if (resolvedSeries.length === 0) {
    return null;
  }

  // Check if we have only one data point
  const isSingleDataPoint = data && data.length === 1;

  // If single data point, switch to bar chart for better visualization
  if (isSingleDataPoint) {
    return (
      <div className="space-y-2">
        <ResponsiveContainer aspect={16 / 9}>
          <RechartsBarChart data={data} margin={{ left: 20 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDark ? '#374151' : '#E5E7EB'}
            />
            <XAxis
              dataKey={xAxisDataKey}
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
            {resolvedSeries.map((s, idx) => (
              <Bar
                key={`${s.dataKey}_${idx}`}
                dataKey={s.dataKey}
                fill={s.color || lineColor}
                radius={[4, 4, 0, 0]}
                maxBarSize={60}
              />
            ))}
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Regular line chart for multiple data points
  return (
    <ResponsiveContainer aspect={16 / 9}>
      <RechartsLineChart data={data} margin={{ left: 20 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={isDark ? '#374151' : '#E5E7EB'}
        />
        <XAxis
          dataKey={xAxisDataKey}
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
        {!hideTooltip && (
          <Tooltip
            cursor={{
              stroke: isDark ? '#4B5563' : '#E5E7EB',
              strokeWidth: 1,
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
        {resolvedSeries.map((s, idx) => {
          const color = s.color || lineColor;

          return (
            <Line
              key={`${s.dataKey}_${idx}`}
              type="monotone"
              dataKey={s.dataKey}
              stroke={color}
              activeDot={{
                r: 5,
                fill: color,
                stroke: isDark ? '#1F2937' : '#FFFFFF',
                strokeWidth: 2,
              }}
              strokeWidth={2}
              dot={{
                r: 4,
                fill: color,
                stroke: isDark ? '#1F2937' : '#FFFFFF',
                strokeWidth: 1,
              }}
            />
          );
        })}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
};
