import * as React from "react";
import { Container, Text } from "@medusajs/ui";
import { ChartNoAxesCombined, CircleSlash2 } from "lucide-react";
import { SmallCardSkeleton } from "../skeletons/SmallCardSkeleton";
import { OrderAnalyticsResponse } from "../hooks/order-analytics";
import { CustomerAnalyticsResponse } from "../hooks/customer-analytics";
import { ShoppingCart, User } from "@medusajs/icons";

type KPIProps<T = OrderAnalyticsResponse> = {
  data: T | undefined;
  isLoading: boolean;
};

export const TotalSales: React.FC<KPIProps> = ({ data, isLoading }) => (
  <Container className="relative">
    <ChartNoAxesCombined className="absolute right-6 text-ui-fg-muted top-4 size-[15px]" />
    <Text size="small">Total Sales</Text>
    {isLoading ? (
      <SmallCardSkeleton />
    ) : (
      <>
        <Text size="xlarge" weight="plus">
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: data?.currency_code || "EUR",
          }).format(data?.total_sales || 0)}
        </Text>
        <Text size="xsmall" className="text-ui-fg-muted">
          {(data?.prev_sales_percent || 0) > 0 && "+"}
          {data?.prev_sales_percent || 0}% from previous period
        </Text>
      </>
    )}
  </Container>
);

export const TotalOrders: React.FC<KPIProps> = ({ isLoading, data }) => (
  <Container className="relative">
    <ShoppingCart className="absolute right-6 top-4 text-ui-fg-muted" />
    <Text size="small">Total Orders</Text>
    {isLoading ? (
      <SmallCardSkeleton />
    ) : (
      <>
        <Text size="xlarge" weight="plus">
          {data?.total_orders || 0}
        </Text>
        <Text size="xsmall" className="text-ui-fg-muted">
          {(data?.prev_orders_percent || 0) > 0 && "+"}
          {data?.prev_orders_percent || 0}% from previous period
        </Text>
      </>
    )}
  </Container>
);

export const AverageOrderValue: React.FC<KPIProps> = ({ isLoading, data }) => {
  const totalSales = data?.total_sales ?? 0;
  const totalOrders = data?.total_orders ?? 0;
  const averageOrderValue =
    totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;
  return (
    <Container className="relative">
      <CircleSlash2 className="absolute right-6 top-4 text-ui-fg-muted" />
      <Text size="small">Average order value</Text>
      {isLoading ? (
        <SmallCardSkeleton />
      ) : (
        <>
          <Text size="xlarge" weight="plus">
            {data?.total_sales && data?.total_orders
              ? Math.round(data?.total_sales / data?.total_orders)
              : 0}
            %
          </Text>
          <Text size="xsmall" className="text-ui-fg-muted">
            {averageOrderValue > 0 && "+"}
            {averageOrderValue}% from previous period
          </Text>
        </>
      )}
    </Container>
  );
};

export const ReturningCustomers: React.FC<
  KPIProps<CustomerAnalyticsResponse> & {
    specificTimeline?: string;
  }
> = ({ data, isLoading, specificTimeline }) => {
  return (
    <Container className="relative">
      <User className="absolute right-6 text-ui-fg-muted top-4 size-[15px]" />
      <Text size="small">
        Returning Customers{" "}
        {specificTimeline && (
          <span className="text-ui-fg-muted">({specificTimeline})</span>
        )}
      </Text>
      {isLoading ? (
        <SmallCardSkeleton />
      ) : (
        <>
          <Text size="xlarge" weight="plus">
            {data?.returning_customers || 0}
          </Text>
        </>
      )}
    </Container>
  );
};
