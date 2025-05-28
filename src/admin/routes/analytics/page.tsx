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
import { Button } from '../../components/ui/button';
import { Calendar } from '../../components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../components/ui/popover';

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

const AnalyticsPage = () => {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const handlePresetSelect = (preset: string) => {
    const today = new Date();

    switch (preset) {
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
  };

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h1">Analytics</Heading>

        <div className="flex gap-2">
          <div className="w-[170px]">
            <Select
              defaultValue="this-month"
              onValueChange={handlePresetSelect}
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
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant="outline"
                className=" justify-start bg-[#fafafa] border-[#dedede] text-[13px] py-1.5 text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-[#71717a]" />
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
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
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
              <div className="flex gap-4 mb-4">
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

                  <Container className="relative">
                    <Text size="xlarge" weight="plus" className="mb-8">
                      Orders Over Time
                    </Text>

                    <LineChart
                      data={data1}
                      xAxisDataKey="name"
                      yAxisDataKey="Number of orders"
                      className="aspect-[16/9]"
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

                  <Container className="relative">
                    <Text size="xlarge" weight="plus" className="mb-8">
                      Sales Over Time
                    </Text>

                    <LineChart
                      data={data2}
                      xAxisDataKey="name"
                      yAxisDataKey="Sales"
                      lineColor="#82ca9d"
                      className="aspect-[16/9]"
                    />
                  </Container>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Container className="relative">
                    <Text size="xlarge" weight="plus" className="mb-8">
                      Top Regions by Sales
                    </Text>
                    <BarChart
                      data={data3}
                      xAxisDataKey="name"
                      yAxisDataKey="Sales"
                      lineColor="#82ca9d"
                      className="aspect-[16/9]"
                    />
                  </Container>
                </div>
                <div className="flex-1">
                  <Container className="relative">
                    <Text size="xlarge" weight="plus" className="mb-8">
                      Order Status Breakdown
                    </Text>
                    <PieChart
                      data={data3}
                      dataKey="Sales"
                      className="aspect-[16/9]"
                    />
                  </Container>
                </div>
              </div>
            </Tabs.Content>
            <Tabs.Content value="products"></Tabs.Content>
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
