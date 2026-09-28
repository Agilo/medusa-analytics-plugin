import { BarChart } from '../BarChart';
import { ChartPanelCard, PanelCard } from '../AnalyticsPanelCards';
import { ProductsTable } from '../ProductsTable';
import { ProductsTableSkeleton } from '../../skeletons/ProductsTableSkeleton';
import { useProductAnalytics } from '../../hooks/product-analytics';
import { useDateRangeParams } from '../../hooks/use-date-range-params';

export const ProductsTab = () => {
  const { date } = useDateRangeParams();
  const { data, isLoading, isError, error } = useProductAnalytics(date);

  const hasTopSelling = data?.variantQuantitySold?.some(
    (item) => item.quantity > 0,
  );
  const outOfStockVariants =
    data?.lowStockVariants?.filter((p) => p.inventoryQuantity === 0) ?? [];
  const lowStockVariants =
    data?.lowStockVariants?.filter((p) => p.inventoryQuantity > 0) ?? [];

  return (
    <>
      <ChartPanelCard
        className="mb-4"
        title="Top-Selling Products"
        description="Products by quantity sold in selected period"
        isLoading={isLoading}
        isError={isError}
        errorMessage={error?.message}
        isEmpty={!data?.variantQuantitySold?.length || !hasTopSelling}
      >
        <BarChart
          data={data?.variantQuantitySold ?? []}
          xAxisDataKey="title"
          yAxisDataKey="quantity"
          lineColor="#82ca9d"
          useStableColors
          colorKeyField="title"
        />
      </ChartPanelCard>

      <div className="flex gap-4 max-xl:flex-col">
        <PanelCard
          title="Out-of-Stock Variants"
          description="Products with zero inventory"
        >
          {isLoading ? (
            <ProductsTableSkeleton />
          ) : (
            <ProductsTable products={outOfStockVariants} />
          )}
        </PanelCard>
        <PanelCard
          title="Low Stock Variants"
          description="Products with inventory below threshold"
        >
          {isLoading ? (
            <ProductsTableSkeleton />
          ) : (
            <ProductsTable products={lowStockVariants} />
          )}
        </PanelCard>
      </div>
    </>
  );
};
