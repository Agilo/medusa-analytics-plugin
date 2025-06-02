import {
  LineChart as RechartsLineChart,
  Line,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';

const dummyData = [
  {
    a: 1,
  },
  {
    a: 3,
  },
  {
    a: 2,
  },
  {
    a: 6,
  },
  {
    a: 4,
  },
  {
    a: 3,
  },
  {
    a: 8,
  },
  {
    a: 5,
  },
];

export const LineChartSkeleton = () => {
  return (
    <ResponsiveContainer aspect={16 / 9}>
      <RechartsLineChart data={dummyData}>
        <CartesianGrid strokeDasharray="3 3" />
        <Line
          type="monotone"
          dataKey="a"
          stroke="#E7E7E7"
          className="animate-pulse"
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
};
