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
};

export const LineChart: React.FC<LineChartProps> = ({
  data,
  xAxisDataKey,
  yAxisDataKey,
  lineColor,
}) => {
  return (
    <ResponsiveContainer aspect={16 / 9}>
      <RechartsLineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xAxisDataKey} />
        <YAxis />
        <Tooltip labelClassName="text-ui-fg-subtle" />
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
