import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
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

export const PieChartSkeleton = () => {
  return (
    <ResponsiveContainer aspect={16 / 9}>
      <RechartsPieChart width={400} height={400}>
        <Pie data={dummyData} dataKey="a" isAnimationActive={false}>
          {dummyData &&
            dummyData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill="#E7E7E7"
                className="animate-pulse"
              />
            ))}
        </Pie>
      </RechartsPieChart>
    </ResponsiveContainer>
  );
};
