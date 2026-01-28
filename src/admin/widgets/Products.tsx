import { defineWidgetConfig } from '@medusajs/admin-sdk';
import { useProductAnalytics } from '../hooks/product-analytics';
import {
  LowStockVariants,
  TopSellingProducts,
  BottomSellingProducts,
} from '../components/Charts';
import {
  useIntervalRange,
  withIntervalRange,
} from '../hooks/use-interval-range';
import { SelectInterval } from '../components/SelectInterval';

export const ProductWidget = withIntervalRange(() => {
  const { range } = useIntervalRange();
  const { data: products, isLoading } = useProductAnalytics(range);

  return (
    <>
      <div className="flex justify-end">
        <SelectInterval />
      </div>

      <div className="flex gap-4 flex-col lg:flex-row items-stretch">
        <TopSellingProducts data={products} isLoading={isLoading} />
        <LowStockVariants data={products} isLoading={isLoading} />
        <BottomSellingProducts data={products} isLoading={isLoading} />
      </div>
    </>
  );
});

export const config = defineWidgetConfig({
  zone: 'product.list.before',
});

export default ProductWidget;
