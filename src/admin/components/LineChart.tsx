import React from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type LineChartProps = {
  data: any[] | undefined;
  xAxisDataKey: string;
  yAxisDataKey: string;
  lineColor?: string;
  yAxisTickFormatter?: (value: number) => string;
};

export const LineChart: React.FC<LineChartProps> = ({
  data,
  xAxisDataKey,
  yAxisDataKey,
  lineColor,
  yAxisTickFormatter,
}) => {
  return (
    <ResponsiveContainer aspect={16 / 9}>
      <RechartsLineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xAxisDataKey} />
        <YAxis tickFormatter={yAxisTickFormatter} />
        <Tooltip
          labelClassName="text-ui-fg-subtle"
          formatter={(value: number) =>
            yAxisTickFormatter ? yAxisTickFormatter(value) : value
          }
          content={({ label, payload }) => {
            if (!payload || !payload.length) return null;
            return (
              <div className="bg-white px-3 py-2 rounded shadow-md text-md text-ui-fg-base">
                <div className="font-medium mb-1">{label}</div>
                {payload.map((entry, idx) => {
                  const v = entry.value;
                  return (
                    <div key={idx}>
                      {typeof v === 'number' && yAxisTickFormatter
                        ? yAxisTickFormatter(v)
                        : v}
                    </div>
                  );
                })}
              </div>
            );
          }}
        />
        <Line
          type="monotone"
          dataKey={yAxisDataKey}
          stroke={lineColor}
          activeDot={{ r: 5 }}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
};
