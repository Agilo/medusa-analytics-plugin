import * as React from 'react';
import { Container, Text } from '@medusajs/ui';
import { ChartStateWrapper } from './StateWrappers';
import { SmallCardSkeleton } from '../skeletons/SmallCardSkeleton';
import { cn } from '../lib/utils/general-utils';

const PanelHeader: React.FC<{
  title: React.ReactNode;
  description?: React.ReactNode;
}> = ({ title, description }) => (
  <>
    <Text size="xlarge" weight="plus">
      {title}
    </Text>
    {description && (
      <Text size="small" className="mb-8 text-ui-fg-muted">
        {description}
      </Text>
    )}
  </>
);

export const PanelCard: React.FC<
  Omit<React.ComponentPropsWithoutRef<typeof Container>, 'title'> & {
    title: React.ReactNode;
    description?: React.ReactNode;
  }
> = ({ title, description, children, ...rest }) => (
  <Container {...rest}>
    <PanelHeader title={title} description={description} />
    {children}
  </Container>
);

export const ChartPanelCard: React.FC<
  Omit<React.ComponentPropsWithoutRef<typeof Container>, 'title'> & {
    title: React.ReactNode;
    description?: React.ReactNode;
    isLoading: boolean;
    isError: boolean;
    errorMessage?: string;
    isEmpty?: boolean;
  }
> = ({
  title,
  description,
  isLoading,
  isError,
  errorMessage,
  isEmpty,
  children,
  className,
  ...rest
}) => (
  <PanelCard
    {...rest}
    title={title}
    description={description}
    className={cn('min-h-[9.375rem]', className)}
  >
    <ChartStateWrapper
      isLoading={isLoading}
      isError={isError}
      errorMessage={errorMessage}
      isEmpty={isEmpty}
    >
      <div className="w-full" style={{ aspectRatio: '16/9' }}>
        {children}
      </div>
    </ChartStateWrapper>
  </PanelCard>
);

export const StatCard: React.FC<
  React.ComponentPropsWithoutRef<typeof Container> & {
    label: React.ReactNode;
    value: React.ReactNode;
    icon?: React.ReactNode;
    isLoading: boolean;
    trend?: number;
  }
> = ({ label, value, icon, isLoading, trend, className, ...rest }) => (
  <Container {...rest} className={cn('relative', className)}>
    {icon && (
      <span className="absolute right-6 top-4 text-ui-fg-muted">{icon}</span>
    )}
    <Text size="small">{label}</Text>
    {isLoading ? (
      <SmallCardSkeleton />
    ) : (
      <>
        <Text size="xlarge" weight="plus">
          {value}
        </Text>
        {trend !== undefined && (
          <Text size="xsmall" className="text-ui-fg-muted">
            {trend > 0 && '+'}
            {trend}% from previous period
          </Text>
        )}
      </>
    )}
  </Container>
);
