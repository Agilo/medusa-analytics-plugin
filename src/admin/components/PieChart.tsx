import React from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { useDarkMode } from '../hooks/use-dark-mode';

type PieChartProps = {
  data: any[] | undefined;
  dataKey: string;
};

const COLORS = [
  '#3B82F6', // blue-500
  '#10B981', // emerald-500
  '#F59E0B', // amber-500
  '#EF4444', // red-500
  '#8B5CF6', // violet-500
  '#06B6D4', // cyan-500
  '#84CC16', // lime-500
  '#F97316', // orange-500
];

const DARK_COLORS = [
  '#60A5FA', // blue-400
  '#34D399', // emerald-400
  '#FBBF24', // amber-400
  '#F87171', // red-400
  '#A78BFA', // violet-400
  '#22D3EE', // cyan-400
  '#A3E635', // lime-400
  '#FB923C', // orange-400
];

export const PieChart: React.FC<PieChartProps> = ({ data, dataKey }) => {
  const isDark = useDarkMode();
  const colors = isDark ? DARK_COLORS : COLORS;

  return (
    <ResponsiveContainer aspect={1} maxHeight={400}>
      <RechartsPieChart>
        <Pie
          data={data}
          label={({ percent }) => `${((percent || 0) * 100).toFixed(0)}%`}
          dataKey={dataKey}
        >
          {data &&
            data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={colors[index % colors.length]}
              />
            ))}
        </Pie>
        <Tooltip
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
          itemStyle={{
            color: isDark ? '#F9FAFB' : '#111827',
          }}
        />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
};
