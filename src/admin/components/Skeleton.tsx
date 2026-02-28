import { twMerge } from 'tailwind-merge';

export const Skeleton: React.FC<React.ComponentProps<'div'>> = ({
  className,
  ...props
}) => (
  <div
    {...props}
    className={twMerge(
      'animate-pulse rounded-md bg-[#F4F4F4] dark:bg-[#3F3F46]',
      className,
    )}
  />
);
