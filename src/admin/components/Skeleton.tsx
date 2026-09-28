import { cn } from '../lib/utils/general-utils';

export const Skeleton: React.FC<React.ComponentProps<'div'>> = ({
  className,
  ...props
}) => (
  <div
    {...props}
    className={cn(
      'animate-pulse rounded-md bg-[#F4F4F4] dark:bg-[#3F3F46]',
      className,
    )}
  />
);
