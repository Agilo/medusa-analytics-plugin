import { Skeleton } from '../components/Skeleton';

export const PieChartSkeleton = () => {
  return (
    <div className="w-full aspect-square max-h-[400px]">
      <Skeleton className="w-full h-full" />
    </div>
  );
};
