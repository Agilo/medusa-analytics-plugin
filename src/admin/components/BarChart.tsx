import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type BarChartProps = {
  data: any[] | undefined;
  xAxisDataKey: string;
  yAxisDataKey: string;
  lineColor?: string;
};

export const BarChart: React.FC<BarChartProps> = ({
  data,
  xAxisDataKey,
  yAxisDataKey,
  lineColor,
}) => {
  return (
    <ResponsiveContainer aspect={16 / 9}>
      <RechartsBarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xAxisDataKey} />
        <YAxis />
        <Tooltip labelClassName="text-ui-fg-subtle" />
        <Bar dataKey={yAxisDataKey} fill={lineColor} />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};
