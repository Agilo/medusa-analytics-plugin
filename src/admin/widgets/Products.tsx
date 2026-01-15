import { defineWidgetConfig } from '@medusajs/admin-sdk';
import { useProductAnalytics } from '../hooks/product-analytics';
import {
  LowStockVariants,
  TopSellingProducts,
  BottomSellingProducts,
} from '../components/Charts';

const today = new Date();
const daysPrior30 = new Date(new Date().setDate(today.getDate() - 30));

export const ProductWidget = () => {
  const { data: products, isLoading } = useProductAnalytics({
    from: daysPrior30,
    to: today,
  });

  return (
    <div className="flex gap-4 flex-col xl:flex-row items-stretch">
      <TopSellingProducts data={products} isLoading={isLoading} />
      <LowStockVariants data={products} isLoading={isLoading} />
      <BottomSellingProducts data={products} isLoading={isLoading} />
    </div>
  );
};

export const config = defineWidgetConfig({
  zone: 'product.list.before',
});

export default ProductWidget;
