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
  yAxisTickFormatter?: (value: number) => string;
};

export const BarChart: React.FC<BarChartProps> = ({
  data,
  xAxisDataKey,
  yAxisDataKey,
  lineColor,
  yAxisTickFormatter,
}) => {
  return (
    <ResponsiveContainer aspect={16 / 9}>
      <RechartsBarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xAxisDataKey} />
        <YAxis tickFormatter={yAxisTickFormatter} allowDecimals={false} />
        <Tooltip
          formatter={(value: number) =>
            yAxisTickFormatter ? yAxisTickFormatter(value) : value
          }
          content={({ label, payload }) => {
            if (!payload || !payload.length) return null;
            return (
              <div className="bg-white px-3 py-2 rounded shadow-md text-md text-[#000]">
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
        <Bar dataKey={yAxisDataKey} fill={lineColor} />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};
