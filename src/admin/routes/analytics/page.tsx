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

const data1 = [
  {
    name: 'Jan 1',
    'Number of orders': 20,
  },
  {
    name: 'Jan 2',
    'Number of orders': 40,
  },
  {
    name: 'Jan 3',
    'Number of orders': 25,
  },
  {
    name: 'Jan 4',
    'Number of orders': 60,
  },
  {
    name: 'Jan 5',
    'Number of orders': 65,
  },
  {
    name: 'Jan 6',
    'Number of orders': 70,
  },
  {
    name: 'Jan 7',
    'Number of orders': 90,
  },
];

const data2 = [
  {
    name: 'Jan 1',
    Sales: 20000,
  },
  {
    name: 'Jan 2',
    Sales: 40000,
  },
  {
    name: 'Jan 3',
    Sales: 25000,
  },
  {
    name: 'Jan 4',
    Sales: 60000,
  },
  {
    name: 'Jan 5',
    Sales: 65000,
  },
  {
    name: 'Jan 6',
    Sales: 60000,
  },
  {
    name: 'Jan 7',
    Sales: 45000,
  },
];

const data3 = [
  {
    name: 'North America',
    Sales: 20000,
  },
  {
    name: 'Europe',
    Sales: 40000,
  },
  {
    name: 'Asia',
    Sales: 25000,
  },
  {
    name: 'Australia',
    Sales: 60000,
  },
  {
    name: 'Africa',
    Sales: 65000,
  },
];

// const products = [
//   {
//     sku: "WH-001-BLK",
//     variantName: "Wireless Headphones - Black	",
//     inventoryQuantity: 0,
//   },
//   {
//     sku: "WH-002-BLK",
//     variantName: "Smart Watch - Silver	",
//     inventoryQuantity: 20,
//   },
//   {
//     sku: "WH-003-BLK",
//     variantName: "Wireless Earbuds - Black	",
//     inventoryQuantity: 30,
//   },
//   {
//     sku: "WH-004-BLK",
//     variantName: "Bluetooth Speaker - Blue	",
//     inventoryQuantity: 0, // Out of stock
//   },
//   {
//     sku: "WH-005-BLK",
//     variantName: "Smartphone Case - Red	",
//     inventoryQuantity: 5,
//   },
//   {
//     sku: "WH-006-BLK",
//     variantName: "Laptop Sleeve - Grey	",
//     inventoryQuantity: 0,
//   },
// ];

const AnalyticsPage = () => {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [selectValue, setSelectValue] = React.useState<string | undefined>(
    'this-month'
  );
  const [popoverOpen, setPopoverOpen] = React.useState<boolean>(false);

  const { data: products } = useProductAnalytics(date);

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
                initialFocus
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
            <Tabs.Trigger value="orders">Orders</Tabs.Trigger>
            <Tabs.Trigger value="products">Products</Tabs.Trigger>
          </Tabs.List>
          <div className="mt-8">
            <Tabs.Content value="orders">
              <div className="flex max-md:flex-col gap-4 mb-4">
                <div className="space-y-4 flex-1">
                  <Container className="relative">
                    <ShoppingCart className="absolute right-6 top-4 text-ui-fg-muted" />
                    <Text size="small">Total Orders</Text>
                    <Text size="xlarge" weight="plus">
                      1,845
                    </Text>
                    <Text size="xsmall" className="text-ui-fg-muted">
                      +12.5% from previous period
                    </Text>
                  </Container>

                  <Container>
                    <Text size="xlarge" weight="plus">
                      Orders Over Time
                    </Text>
                    <Text size="small" className="mb-8 text-ui-fg-muted">
                      Total number of orders in the selected period
                    </Text>
                    <LineChart
                      data={data1}
                      xAxisDataKey="name"
                      yAxisDataKey="Number of orders"
                    />
                  </Container>
                </div>

                <div className="space-y-4 flex-1">
                  <Container className="relative">
                    <ChartNoAxesCombined className="absolute right-6 text-ui-fg-muted top-4 size-[15px]" />
                    <Text size="small">Total Sales</Text>
                    <Text size="xlarge" weight="plus">
                      $387,200
                    </Text>
                    <Text size="xsmall" className="text-ui-fg-muted">
                      +8.2% from previous period
                    </Text>
                  </Container>

                  <Container>
                    <Text size="xlarge" weight="plus">
                      Sales Over Time
                    </Text>
                    <Text size="small" className="mb-8 text-ui-fg-muted">
                      Total sales in the selected period
                    </Text>
                    <LineChart
                      data={data2}
                      xAxisDataKey="name"
                      yAxisDataKey="Sales"
                      lineColor="#82ca9d"
                    />
                  </Container>
                </div>
              </div>
              <div className="flex max-md:flex-col gap-4">
                <div className="flex-1">
                  <Container>
                    <Text size="xlarge" weight="plus">
                      Top Regions by Sales
                    </Text>
                    <Text size="small" className="mb-8 text-ui-fg-muted">
                      Sales breakdown by region in the selected period
                    </Text>
                    <BarChart
                      data={data3}
                      xAxisDataKey="name"
                      yAxisDataKey="Sales"
                      lineColor="#82ca9d"
                    />
                  </Container>
                </div>
                <div className="flex-1">
                  <Container>
                    <Text size="xlarge" weight="plus">
                      Order Status Breakdown
                    </Text>
                    <Text size="small" className="mb-8 text-ui-fg-muted">
                      Distribution of orders by status in the selected period
                    </Text>
                    <PieChart data={data3} dataKey="Sales" />
                  </Container>
                </div>
              </div>
            </Tabs.Content>
            <Tabs.Content value="products">
              <Container className="mb-4">
                <Text size="xlarge" weight="plus">
                  Top-Selling Products
                </Text>
                <Text size="small" className="mb-8 text-ui-fg-muted">
                  Products by quantity sold in selected period
                </Text>
                <BarChart
                  data={products?.variantQuantitySold || []}
                  xAxisDataKey="name"
                  yAxisDataKey="quantity"
                  lineColor="#82ca9d"
                />
              </Container>
              <div className="flex gap-4 max-xl:flex-col">
                <Container>
                  <Text size="xlarge" weight="plus">
                    Out-of-Stock Variants
                  </Text>
                  <Text size="small" className="mb-8 text-ui-fg-muted">
                    Products with zero inventory
                  </Text>
                  <ProductsTable
                    products={
                      products?.lowStockVariants?.filter(
                        (product) => product.inventoryQuantity === 0
                      ) || []
                    }
                  />
                </Container>
                <Container>
                  <Text size="xlarge" weight="plus">
                    Low Stock Variants
                  </Text>
                  <Text size="small" className="mb-8 text-ui-fg-muted">
                    Products with inventory below threshold
                  </Text>
                  <ProductsTable
                    products={
                      products?.lowStockVariants?.filter(
                        (product) => product.inventoryQuantity > 0
                      ) || []
                    }
                  />
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
