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
} from '@medusajs/icons';
import { ChartNoAxesCombined } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

import { LineChart } from '../../components/LineChart';
import { BarChart } from '../../components/BarChart';
import { PieChart } from '../../components/PieChart';
import { Calendar } from '../../components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../components/ui/popover';
import { ProductsTable } from '../../components/ProductsTable';
import { useProductAnalytics } from '../../hooks/product-analytics';
import { useOrderAnalytics } from '../../hooks/order-analytics';
import { SmallCardSkeleton } from '../../skeletons/SmallCardSkeleton';
import { LineChartSkeleton } from '../../skeletons/LineChartSkeleton';
import { BarChartSkeleton } from '../../skeletons/BarChartSkeleton';
import { PieChartSkeleton } from '../../skeletons/PieChartSkeleton';
import { ProductsTableSkeleton } from '../../skeletons/ProductsTableSkeleton';

/* Popravit dark mode */

const AnalyticsPage = () => {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [selectValue, setSelectValue] = React.useState<string | undefined>(
    'this-month'
  );
  const [popoverOpen, setPopoverOpen] = React.useState<boolean>(false);

  const { data: products, isLoading: isLoadingProducts } =
    useProductAnalytics(date);

  const { data: orders, isLoading: isLoadingOrders } = useOrderAnalytics(date);

  const someOrderCountsGreaterThanZero = orders?.order_count?.some(
    (item) => item.count > 0
  );

  const someOrderSalesGreaterThanZero = orders?.order_sales?.some(
    (item) => item.sales > 0
  );

  const someTopSellingProductsGreaterThanZero =
    products?.variantQuantitySold?.some((item) => item.quantity > 0);

  React.useEffect(() => {
    const today = new Date();

    switch (selectValue) {
      case 'this-month':
        setDate({
          from: startOfMonth(today),
          to: today,
        });
        break;
      case 'last-month':
        setDate({
          from: startOfMonth(subMonths(today, 1)),
          to: endOfMonth(subMonths(today, 1)),
        });
        break;
      case 'last-3-months':
        setDate({
          from: subMonths(today, 3),
          to: today,
        });
        break;
    }
  }, [selectValue]);

  React.useEffect(() => {
    if (selectValue !== 'custom' && date && popoverOpen) {
      setSelectValue('custom');
    }
  }, [date]);

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
              onValueChange={setSelectValue}
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
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger
              disabled={isLoadingOrders || isLoadingProducts}
              id="date"
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-md text-sm transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive justify-start focus-visible:shadow-borders-interactive-with-active disabled:bg-ui-bg-disabled disabled:text-ui-fg-disabled bg-ui-bg-field text-ui-fg-base txt-compact-small py-1.5 h-auto text-left font-normal data-[state=open]:!shadow-borders-interactive-with-active shadow-buttons-neutral hover:bg-ui-bg-field-hover outline-none transition-fg disabled:cursor-not-allowed min-w-[260px] bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 px-4 dark:border-input dark:hover:bg-input/50"
            >
              <CalendarIcon className="mr-2 h-4 w-4 text-ui-fg-muted group-disabled:text-ui-fg-disabled" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, 'LLL dd, y')} -{' '}
                    {format(date.to, 'LLL dd, y')}
                  </>
                ) : (
                  format(date.from, 'LLL dd, y')
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-transparent" align="end">
              <Calendar
                autoFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <div className="px-6 py-4">
        <Tabs defaultValue="orders">
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
                      <LineChart
                        data={orders?.order_count}
                        xAxisDataKey="name"
                        yAxisDataKey="count"
                      />
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
                      Total sales in the selected period
                    </Text>
                    {isLoadingOrders ? (
                      <LineChartSkeleton />
                    ) : orders?.order_sales &&
                      orders?.order_sales?.length > 0 &&
                      someOrderSalesGreaterThanZero ? (
                      <LineChart
                        data={orders?.order_sales}
                        xAxisDataKey="name"
                        yAxisDataKey="sales"
                        lineColor="#82ca9d"
                        yAxisTickFormatter={(value: number) =>
                          new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: orders.currency_code,
                            maximumFractionDigits: 0,
                          }).format(value)
                        }
                      />
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
                      <BarChart
                        data={orders?.regions}
                        xAxisDataKey="name"
                        yAxisDataKey="sales"
                        lineColor="#82ca9d"
                        yAxisTickFormatter={(value: number) =>
                          new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: orders.currency_code,
                            maximumFractionDigits: 0,
                          }).format(value)
                        }
                      />
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
                      <PieChart data={orders?.statuses} dataKey="count" />
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
                  <BarChart
                    data={products.variantQuantitySold}
                    xAxisDataKey="title"
                    yAxisDataKey="quantity"
                    lineColor="#82ca9d"
                  />
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
