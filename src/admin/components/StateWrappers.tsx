import * as React from 'react';
import { Skeleton } from './Skeleton';
import { Text } from '@medusajs/ui';
import { SmallCardSkeleton } from '../skeletons/SmallCardSkeleton';

type BaseStateWrapperProps = {
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  isEmpty?: boolean;
  emptyText?: string;
  children: React.ReactNode;
};

export const ChartStateWrapper: React.FC<BaseStateWrapperProps> = ({
  isLoading,
  isError,
  errorMessage,
  isEmpty = false,
  emptyText = 'No data available for the selected period.',
  children,
}) => {
  if (isLoading) {
    return <Skeleton className="w-full h-44" />;
  }

  if (isError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center aspect-video w-full mt-2.5 max-h-44">
        <Text size="xsmall" className="text-ui-fg-error">
          Unable to load chart data.
        </Text>

        <Text size="xsmall" className="text-ui-fg-muted max-w-72 truncate">
          {errorMessage}
        </Text>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <Text
        size="xsmall"
        className="text-ui-fg-muted flex items-center justify-center flex-1 aspect-video w-full mt-2.5 max-h-44"
      >
        {emptyText}
      </Text>
    );
  }

  return children;
};

export const KPIStateWrapper: React.FC<BaseStateWrapperProps> = ({
  isLoading,
  isError,
  errorMessage,
  isEmpty = false,
  emptyText = 'No KPI data available for the selected period.',
  children,
}) => {
  if (isLoading) {
    return (
      <div className="flex gap-4 justify-between flex-1">
        <div>
          <SmallCardSkeleton />
        </div>
        <Skeleton className="aspect-video w-full max-w-64 mt-2.5" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center py-4 max-h-44 aspect-video w-full">
        <Text size="xsmall" className="text-ui-fg-error">
          Unable to load KPI data.
        </Text>

        <Text size="xsmall" className="text-ui-fg-muted max-w-72 truncate">
          {errorMessage}
        </Text>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <Text
        size="xsmall"
        className="text-ui-fg-muted flex items-center justify-center flex-1 py-4 max-h-44 aspect-video w-full"
      >
        {emptyText}
      </Text>
    );
  }

  return children;
};
