import * as React from 'react';
import { Skeleton } from './Skeleton';
import { Text } from '@medusajs/ui';
import { SmallCardSkeleton } from '../skeletons/SmallCardSkeleton';

export const ChartStateWrapper: React.FC<{
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  isEmpty: boolean;
  emptyText?: string;
  children: React.ReactNode;
}> = ({
  isLoading,
  isError,
  errorMessage,
  isEmpty,
  emptyText = 'No data available for the selected period.',
  children,
}) => {
  if (isLoading) {
    return <Skeleton className="w-full h-44" />;
  }

  if (!isError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
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
        className="text-ui-fg-muted flex items-center justify-center flex-1"
      >
        {emptyText}
      </Text>
    );
  }

  return children;
};

export const KPIStateWrapper: React.FC<{
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  isEmpty?: boolean;
  emptyText?: string;
  children: React.ReactNode;
}> = ({
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
        <Skeleton className="aspect-video w-64 mt-2.5" />
      </div>
    );
  }

  if (!isError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center py-4">
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
        className="text-ui-fg-muted flex items-center justify-center flex-1 py-4"
      >
        {emptyText}
      </Text>
    );
  }

  return children;
};
