import {
  BarChart as RechartsBarChart,
  Bar,
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

export const BarChartSkeleton = () => {
  return (
    <ResponsiveContainer aspect={16 / 9}>
      <RechartsBarChart data={dummyData}>
        <CartesianGrid strokeDasharray="3 3" />
        <Bar
          dataKey="a"
          fill="#E7E7E7"
          className="animate-pulse"
          isAnimationActive={false}
        />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};
