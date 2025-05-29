import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

type PieChartProps = {
  data: any[] | undefined;
  dataKey: string;
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export const PieChart: React.FC<PieChartProps> = ({ data, dataKey }) => {
  return (
    <ResponsiveContainer aspect={16 / 9}>
      <RechartsPieChart width={400} height={400}>
        <Pie
          data={data}
          label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
          dataKey={dataKey}
        >
          {data &&
            data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
        </Pie>
        <Tooltip />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
};
