import * as React from 'react';
import { Button, Container, Text } from '@medusajs/ui';
import { ArrowDownMini, ArrowUpMini, Equals } from '@medusajs/icons';
import { ChartStateWrapper, KPIStateWrapper } from './StateWrappers';
import { cn } from '../lib/utils/general-utils';
import { Link } from 'react-router-dom';

// Chart card
const CardHeader: React.FC<
  Omit<React.ComponentPropsWithoutRef<'div'>, 'title'> & {
    title: React.ReactNode;
    description?: React.ReactNode;
    href: string;
  }
> = ({ title, description, href, className, ...rest }) => (
  <div {...rest} className={cn('flex justify-between', className)}>
    <div>
      <Text size="large" weight={description ? 'plus' : 'regular'}>
        {title}
      </Text>
      {description && (
        <Text size="xsmall" className="mb-4 text-ui-fg-muted">
          {description}
        </Text>
      )}
    </div>

    <Link to={href}>
      <Button variant="transparent" className="text-ui-fg-muted text-xs">
        View more
      </Button>
    </Link>
  </div>
);

export const ChartCard: React.FC<
  React.ComponentPropsWithoutRef<typeof Container> & {
    title: React.ReactNode;
    description?: React.ReactNode;
    href: string;
    isLoading: boolean;
    isError: boolean;
    errorMessage?: string;
    isEmpty?: boolean;
  }
> = ({
  title,
  description,
  href,
  isLoading,
  isError,
  errorMessage,
  isEmpty,
  children,
  className,
  ...rest
}) => (
  <Container {...rest} className={cn('flex flex-col', className)}>
    <CardHeader title={title} description={description} href={href} />
    <ChartStateWrapper
      isLoading={isLoading}
      isError={isError}
      errorMessage={errorMessage}
      isEmpty={isEmpty}
    >
      {children}
    </ChartStateWrapper>
  </Container>
);

// KPI card:
const KPITimelineLabel = ({ percentage }: { percentage: number }) => (
  <Text size="small" className="text-ui-fg-muted">
    <span
      className={cn(
        percentage > 0 && 'text-ui-tag-green-text',
        percentage === 0 && 'text-ui-fg-muted',
        percentage < 0 && 'text-ui-fg-error',
        'inline-flex items-baseline gap-0.5',
      )}
    >
      {percentage > 0 && (
        <ArrowUpMini className="size-3 self-center" viewBox="0 0 15 15" />
      )}
      {percentage === 0 && (
        <Equals className="size-3 self-center" viewBox="0 0 15 15" />
      )}
      {percentage < 0 && (
        <ArrowDownMini className="size-3 self-center" viewBox="0 0 15 15" />
      )}
      {new Intl.NumberFormat(undefined, {
        style: 'percent',
        maximumFractionDigits: 2,
      }).format(Math.abs(percentage))}
    </span>{' '}
    from the previous period
  </Text>
);

export const KPICard: React.FC<
  React.ComponentPropsWithoutRef<typeof Container> & {
    title: React.ReactNode;
    href: string;
    isLoading: boolean;
    isError: boolean;
    errorMessage?: string;
    value: React.ReactNode;
    percentage: number;
  }
> = ({
  title,
  href,
  isLoading,
  isError,
  errorMessage,
  value,
  percentage,
  children,
  className,
  ...rest
}) => (
  <Container {...rest} className={cn('flex flex-col', className)}>
    <CardHeader title={title} href={href} className="items-center" />
    <KPIStateWrapper
      isLoading={isLoading}
      isError={isError}
      errorMessage={errorMessage}
    >
      <div className="flex gap-4 justify-between flex-1">
        <div>
          <Text size="xlarge" weight="plus">
            {value}
          </Text>
          <KPITimelineLabel percentage={percentage} />
        </div>

        <div className="flex-1 flex mt-2.5">
          <div className="aspect-video mt-auto w-full max-w-64 ml-auto">
            {children}
          </div>
        </div>
      </div>
    </KPIStateWrapper>
  </Container>
);
