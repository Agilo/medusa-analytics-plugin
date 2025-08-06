import * as React from 'react';
import { defineRouteConfig } from '@medusajs/admin-sdk';
import {
  Container,
  DateRange,
  Heading,
  Select,
  Tabs,
  Text,
} from '@medusajs/ui';
import {
  ChartBar,
  ShoppingCart,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from '@medusajs/icons';
import { ChartNoAxesCombined } from 'lucide-react';
import { subMonths, startOfMonth, endOfMonth } from 'date-fns';
import {
  Button,
  CalendarCell,
  CalendarGrid,
  DateInput,
  DateRangePicker,
  DateSegment,
  Dialog,
  Group,
  Heading as AriaHeading,
  Popover,
  RangeCalendar,
  DateValue,
} from 'react-aria-components';
import { CalendarDate } from '@internationalized/date';
import type { RangeValue } from '@react-types/shared';
import { useSearchParams } from 'react-router-dom';

import { LineChart } from '../../components/LineChart';
import { BarChart } from '../../components/BarChart';
import { PieChart } from '../../components/PieChart';
import { ProductsTable } from '../../components/ProductsTable';
import { useProductAnalytics } from '../../hooks/product-analytics';
import { useOrderAnalytics } from '../../hooks/order-analytics';
import { SmallCardSkeleton } from '../../skeletons/SmallCardSkeleton';
import { LineChartSkeleton } from '../../skeletons/LineChartSkeleton';
import { BarChartSkeleton } from '../../skeletons/BarChartSkeleton';
import { PieChartSkeleton } from '../../skeletons/PieChartSkeleton';
import { ProductsTableSkeleton } from '../../skeletons/ProductsTableSkeleton';

// Helper functions to convert between DateRange and RangeValue<DateValue>
function dateToCalendarDate(date: Date): CalendarDate {
  return new CalendarDate(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate()
  );
}

function calendarDateToDate(calendarDate: DateValue): Date {
  const year =
    'year' in calendarDate ? calendarDate.year : new Date().getFullYear();
  const month =
    'month' in calendarDate ? calendarDate.month : new Date().getMonth() + 1;
  const day = 'day' in calendarDate ? calendarDate.day : new Date().getDate();
  return new Date(year, month - 1, day);
}

function dateRangeToRangeValue(
  dateRange: DateRange | undefined
): RangeValue<DateValue> | null {
  if (!dateRange?.from) return null;
  return {
    start: dateToCalendarDate(dateRange.from),
    end: dateRange.to
      ? dateToCalendarDate(dateRange.to)
      : dateToCalendarDate(dateRange.from),
  };
}

function rangeValueToDateRange(
  rangeValue: RangeValue<DateValue> | null
): DateRange | undefined {
  if (!rangeValue) return undefined;
  return {
    from: calendarDateToDate(rangeValue.start),
    to: rangeValue.end ? calendarDateToDate(rangeValue.end) : undefined,
  };
}

const AnalyticsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [date, setDate] = React.useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [selectValue, setSelectValue] = React.useState<string>('this-month');

  const { data: products, isLoading: isLoadingProducts } =
    useProductAnalytics(date);

  const { data: orders, isLoading: isLoadingOrders } = useOrderAnalytics(
    selectValue,
    date
  );

  const someOrderCountsGreaterThanZero = orders?.order_count?.some(
    (item) => item.count > 0
  );

  const someOrderSalesGreaterThanZero = orders?.order_sales?.some(
    (item) => item.sales > 0
  );

  const someTopSellingProductsGreaterThanZero =
    products?.variantQuantitySold?.some((item) => item.quantity > 0);

  const updateDatePreset = React.useCallback((preset: string) => {
    const today = new Date();

    switch (preset) {
      case 'this-month':
        setDate({
          from: startOfMonth(today),
          to: today,
        });
        setSelectValue('this-month');
        break;
      case 'last-month':
        setDate({
          from: startOfMonth(subMonths(today, 1)),
          to: endOfMonth(subMonths(today, 1)),
        });
        setSelectValue('last-month');
        break;
      case 'last-3-months':
        setDate({
          from: startOfMonth(subMonths(today, 3)),
          to: endOfMonth(subMonths(today, 1)),
        });
        setSelectValue('last-3-months');
        break;
      case 'custom':
      default:
        // Keep the current date when switching to custom
        setSelectValue('custom');
        break;
    }
  }, []);

  // Handle date range changes and automatically switch to custom
  const handleDateRangeChange = React.useCallback(
    (value: RangeValue<DateValue> | null) => {
      const newDateRange = rangeValueToDateRange(value);
      setDate(newDateRange);
      // Only switch to custom if the value is different from preset values
      if (selectValue !== 'custom') {
        setSelectValue('custom');
      }
    },
    []
  );

  return (
    <Container className="divide-y p-0">
      <div className="flex flex-wrap gap-x-2 gap-y-4 items-center justify-between px-6 py-4">
        <Heading level="h1">Analytics</Heading>

        <div className="flex flex-wrap gap-2">
          <div className="w-[170px]">
            <Select
              disabled={isLoadingOrders || isLoadingProducts}
              defaultValue="this-month"
              value={selectValue}
              onValueChange={updateDatePreset}
            >
              <Select.Trigger>
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="this-month">This Month</Select.Item>
                <Select.Item value="last-month">Last Month</Select.Item>
                <Select.Item value="last-3-months">Last 3 Months</Select.Item>
                <Select.Item value="custom">Custom</Select.Item>
              </Select.Content>
            </Select>
          </div>
          <DateRangePicker
            value={dateRangeToRangeValue(date)}
            onChange={handleDateRangeChange}
            isDisabled={isLoadingOrders || isLoadingProducts}
            aria-label="Date range"
          >
            <Group className="inline-flex items-center gap-2 whitespace-nowrap rounded-md text-sm transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive justify-start focus-visible:shadow-borders-interactive-with-active disabled:bg-ui-bg-disabled disabled:text-ui-fg-disabled bg-ui-bg-field text-ui-fg-base txt-compact-small h-8 text-left font-normal data-[state=open]:!shadow-borders-interactive-with-active shadow-buttons-neutral hover:bg-ui-bg-field-hover outline-none transition-fg disabled:cursor-not-allowed min-w-[260px] bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-ui-bg-field-component dark:border-ui-border-base dark:hover:bg-ui-bg-field-hover px-4 border cursor-pointer">
              <CalendarIcon className="h-4 w-4 text-ui-fg-muted group-disabled:text-ui-fg-disabled flex-shrink-0" />
              <DateInput slot="start" className="flex-1 min-w-0">
                {(segment) => (
                  <DateSegment
                    segment={segment}
                    className="outline-none rounded-sm focus:bg-ui-bg-interactive focus:text-ui-fg-on-color caret-transparent placeholder-shown:italic text-ui-fg-base data-[placeholder]:text-ui-fg-muted"
                  />
                )}
              </DateInput>
              <span aria-hidden="true" className="text-ui-fg-muted px-1">
                —
              </span>
              <DateInput slot="end" className="flex-1 min-w-0">
                {(segment) => (
                  <DateSegment
                    segment={segment}
                    className="outline-none rounded-sm focus:bg-ui-bg-interactive focus:text-ui-fg-on-color caret-transparent placeholder-shown:italic text-ui-fg-base data-[placeholder]:text-ui-fg-muted"
                  />
                )}
              </DateInput>
              <Button className="text-ui-fg-muted hover:bg-ui-bg-subtle dark:hover:bg-ui-bg-subtle rounded p-1">
                <ChevronDown className="size-4" />
              </Button>
            </Group>
            <Popover className="w-auto p-0 bg-transparent z-50">
              <Dialog className="bg-ui-bg-base dark:bg-ui-bg-base border border-ui-border-base dark:border-ui-border-base rounded-lg shadow-lg p-6 max-w-fit">
                <RangeCalendar
                  className="w-fit"
                  visibleDuration={{ months: 2 }}
                >
                  <header className="flex items-center justify-between mb-4">
                    <Button
                      slot="previous"
                      className="p-2 hover:bg-ui-bg-subtle dark:hover:bg-ui-bg-subtle rounded text-ui-fg-base"
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <AriaHeading className="font-semibold text-lg text-ui-fg-base" />
                    <Button
                      slot="next"
                      className="p-2 hover:bg-ui-bg-subtle dark:hover:bg-ui-bg-subtle rounded text-ui-fg-base"
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </header>
                  <div className="flex gap-6">
                    <CalendarGrid className="border-collapse gap-1">
                      {(date) => (
                        <CalendarCell
                          date={date}
                          className="w-9 h-9 text-sm cursor-pointer rounded flex items-center justify-center hover:bg-ui-bg-subtle dark:hover:bg-ui-bg-subtle selected:bg-ui-bg-interactive selected:text-ui-fg-on-color selection-start:bg-ui-bg-interactive selection-start:text-ui-fg-on-color selection-end:bg-ui-bg-interactive selection-end:text-ui-fg-on-color outside-month:text-ui-fg-disabled unavailable:text-ui-fg-disabled unavailable:cursor-default text-ui-fg-base data-[selected]:bg-ui-bg-interactive data-[selected]:text-ui-fg-on-color data-[selection-start]:bg-ui-bg-interactive data-[selection-start]:text-ui-fg-on-color data-[selection-end]:bg-ui-bg-interactive data-[selection-end]:text-ui-fg-on-color"
                        />
                      )}
                    </CalendarGrid>
                    <CalendarGrid
                      offset={{ months: 1 }}
                      className="border-collapse gap-1"
                    >
                      {(date) => (
                        <CalendarCell
                          date={date}
                          className="w-9 h-9 text-sm cursor-pointer rounded flex items-center justify-center hover:bg-ui-bg-subtle dark:hover:bg-ui-bg-subtle selected:bg-ui-bg-interactive selected:text-ui-fg-on-color selection-start:bg-ui-bg-interactive selection-start:text-ui-fg-on-color selection-end:bg-ui-bg-interactive selection-end:text-ui-fg-on-color outside-month:text-ui-fg-disabled unavailable:text-ui-fg-disabled unavailable:cursor-default text-ui-fg-base data-[selected]:bg-ui-bg-interactive data-[selected]:text-ui-fg-on-color data-[selection-start]:bg-ui-bg-interactive data-[selection-start]:text-ui-fg-on-color data-[selection-end]:bg-ui-bg-interactive data-[selection-end]:text-ui-fg-on-color"
                        />
                      )}
                    </CalendarGrid>
                  </div>
                </RangeCalendar>
              </Dialog>
            </Popover>
          </DateRangePicker>
        </div>
      </div>
      <div className="px-6 py-4">
        <Tabs
          value={searchParams.get('tab') || 'orders'}
          onValueChange={(value) => {
            searchParams.set('tab', value);
            setSearchParams(searchParams);
          }}
        >
          <Tabs.List>
            <Tabs.Trigger
              value="orders"
              disabled={isLoadingOrders || isLoadingProducts}
            >
              Orders
            </Tabs.Trigger>
            <Tabs.Trigger
              value="products"
              disabled={isLoadingOrders || isLoadingProducts}
            >
              Products
            </Tabs.Trigger>
          </Tabs.List>
          <div className="mt-8">
            <Tabs.Content value="orders">
              <div className="flex max-md:flex-col gap-4 mb-4">
                <div className="space-y-4 flex-1">
                  <Container className="relative">
                    <ShoppingCart className="absolute right-6 top-4 text-ui-fg-muted" />
                    <Text size="small">Total Orders</Text>
                    {isLoadingOrders ? (
                      <SmallCardSkeleton />
                    ) : (
                      <>
                        <Text size="xlarge" weight="plus">
                          {orders?.total_orders || 0}
                        </Text>
                        <Text size="xsmall" className="text-ui-fg-muted">
                          {(orders?.prev_orders_percent || 0) > 0 && '+'}
                          {orders?.prev_orders_percent || 0}% from previous
                          period
                        </Text>
                      </>
                    )}
                  </Container>

                  <Container className="min-h-[9.375rem]">
                    <Text size="xlarge" weight="plus">
                      Orders Over Time
                    </Text>
                    <Text size="small" className="mb-8 text-ui-fg-muted">
                      Total number of orders in the selected period
                    </Text>
                    {isLoadingOrders ? (
                      <LineChartSkeleton />
                    ) : orders?.order_count &&
                      orders?.order_count?.length > 0 &&
                      someOrderCountsGreaterThanZero ? (
                      <div className="w-full" style={{ aspectRatio: '16/9' }}>
                        <LineChart
                          data={orders?.order_count}
                          xAxisDataKey="name"
                          yAxisDataKey="count"
                        />
                      </div>
                    ) : (
                      <Text
                        size="small"
                        className="text-ui-fg-muted text-center"
                      >
                        No data available for the selected period.
                      </Text>
                    )}
                  </Container>
                </div>

                <div className="space-y-4 flex-1">
                  <Container className="relative">
                    <ChartNoAxesCombined className="absolute right-6 text-ui-fg-muted top-4 size-[15px]" />
                    <Text size="small">Total Sales</Text>
                    {isLoadingOrders ? (
                      <SmallCardSkeleton />
                    ) : (
                      <>
                        <Text size="xlarge" weight="plus">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: orders?.currency_code || 'EUR',
                          }).format(orders?.total_sales || 0)}
                        </Text>
                        <Text size="xsmall" className="text-ui-fg-muted">
                          {(orders?.prev_sales_percent || 0) > 0 && '+'}
                          {orders?.prev_sales_percent || 0}% from previous
                          period
                        </Text>
                      </>
                    )}
                  </Container>

                  <Container className="min-h-[9.375rem]">
                    <Text size="xlarge" weight="plus">
                      Sales Over Time
                    </Text>
                    <Text size="small" className="mb-8 text-ui-fg-muted">
                      Total sales in the selected period (
                      {orders?.currency_code})
                    </Text>
                    {isLoadingOrders ? (
                      <LineChartSkeleton />
                    ) : orders?.order_sales &&
                      orders?.order_sales?.length > 0 &&
                      someOrderSalesGreaterThanZero ? (
                      <div className="w-full" style={{ aspectRatio: '16/9' }}>
                        <LineChart
                          data={orders.order_sales}
                          xAxisDataKey="name"
                          yAxisDataKey="sales"
                          lineColor="#82ca9d"
                          yAxisTickFormatter={(value: number) =>
                            new Intl.NumberFormat('en-US', {
                              currency: orders.currency_code,
                              maximumFractionDigits: 0,
                            }).format(value)
                          }
                        />
                      </div>
                    ) : (
                      <Text
                        size="small"
                        className="text-ui-fg-muted text-center"
                      >
                        No data available for the selected period.
                      </Text>
                    )}
                  </Container>
                </div>
              </div>
              <div className="flex max-md:flex-col gap-4">
                <div className="flex-1">
                  <Container className="min-h-[9.375rem]">
                    <Text size="xlarge" weight="plus">
                      Top Regions by Sales
                    </Text>
                    <Text size="small" className="mb-8 text-ui-fg-muted">
                      Sales breakdown by region in the selected period
                    </Text>
                    {isLoadingOrders ? (
                      <BarChartSkeleton />
                    ) : orders?.regions && orders?.regions?.length > 0 ? (
                      <div className="w-full" style={{ aspectRatio: '16/9' }}>
                        <BarChart
                          data={orders.regions}
                          xAxisDataKey="name"
                          yAxisDataKey="sales"
                          lineColor="#82ca9d"
                          useStableColors={true}
                          colorKeyField="name"
                          yAxisTickFormatter={(value: number) =>
                            new Intl.NumberFormat('en-US', {
                              currency: orders.currency_code,
                              maximumFractionDigits: 0,
                            }).format(value)
                          }
                        />
                      </div>
                    ) : (
                      <Text
                        size="small"
                        className="text-ui-fg-muted text-center"
                      >
                        No data available for the selected period.
                      </Text>
                    )}
                  </Container>
                </div>
                <div className="flex-1">
                  <Container className="min-h-[9.375rem]">
                    <Text size="xlarge" weight="plus">
                      Order Status Breakdown
                    </Text>
                    <Text size="small" className="mb-8 text-ui-fg-muted">
                      Distribution of orders by status in the selected period
                    </Text>
                    {isLoadingOrders ? (
                      <PieChartSkeleton />
                    ) : orders?.statuses && orders?.statuses?.length > 0 ? (
                      <div className="w-full" style={{ aspectRatio: '16/9' }}>
                        <PieChart data={orders?.statuses} dataKey="count" />
                      </div>
                    ) : (
                      <Text
                        size="small"
                        className="text-ui-fg-muted text-center"
                      >
                        No data available for the selected period.
                      </Text>
                    )}
                  </Container>
                </div>
              </div>
            </Tabs.Content>
            <Tabs.Content value="products">
              <Container className="mb-4 min-h-[9.375rem]">
                <Text size="xlarge" weight="plus">
                  Top-Selling Products
                </Text>
                <Text size="small" className="mb-8 text-ui-fg-muted">
                  Products by quantity sold in selected period
                </Text>
                {isLoadingProducts ? (
                  <BarChartSkeleton />
                ) : products?.variantQuantitySold &&
                  someTopSellingProductsGreaterThanZero ? (
                  <div className="w-full" style={{ aspectRatio: '16/9' }}>
                    <BarChart
                      data={products.variantQuantitySold}
                      xAxisDataKey="title"
                      yAxisDataKey="quantity"
                      lineColor="#82ca9d"
                      useStableColors={true}
                      colorKeyField="title"
                    />
                  </div>
                ) : (
                  <Text size="small" className="text-ui-fg-muted text-center">
                    No data available for the selected period.
                  </Text>
                )}
              </Container>
              <div className="flex gap-4 max-xl:flex-col">
                <Container>
                  <Text size="xlarge" weight="plus">
                    Out-of-Stock Variants
                  </Text>
                  <Text size="small" className="mb-8 text-ui-fg-muted">
                    Products with zero inventory
                  </Text>
                  {isLoadingProducts ? (
                    <ProductsTableSkeleton />
                  ) : (
                    <ProductsTable
                      products={
                        products?.lowStockVariants?.filter(
                          (product) => product.inventoryQuantity === 0
                        ) || []
                      }
                    />
                  )}
                </Container>
                <Container>
                  <Text size="xlarge" weight="plus">
                    Low Stock Variants
                  </Text>
                  <Text size="small" className="mb-8 text-ui-fg-muted">
                    Products with inventory below threshold
                  </Text>
                  {isLoadingProducts ? (
                    <ProductsTableSkeleton />
                  ) : (
                    <ProductsTable
                      products={
                        products?.lowStockVariants?.filter(
                          (product) => product.inventoryQuantity > 0
                        ) || []
                      }
                    />
                  )}
                </Container>
              </div>
            </Tabs.Content>
          </div>
        </Tabs>
      </div>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: 'Analytics',
  icon: ChartBar,
});

export default AnalyticsPage;
