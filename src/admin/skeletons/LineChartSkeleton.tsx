import { Skeleton } from '../components/Skeleton';

export const LineChartSkeleton = () => {
  return (
    <div className="w-full" style={{ aspectRatio: '16/9' }}>
      <Skeleton className="w-full h-full" />
    </div>
  );
};
