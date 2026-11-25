import * as React from 'react';
import {
  createDataTableColumnHelper,
  useDataTable,
  DataTable,
  DataTablePaginationState,
  DataTableSortingState,
  Text,
  Tooltip,
  TooltipProvider,
} from '@medusajs/ui';
import { useNavigate } from 'react-router-dom';
import type { ReturnAnalyticsResponse } from '../lib/data/return-analytics';
import { ProductThumbnail } from './ProductThumbnail';

type ReturnedProduct = ReturnAnalyticsResponse['returned_variants'][number];

type ReturnedProductsTableProps = {
  products: ReturnedProduct[];
};

/** Medusa's name for the only variant of a product without options. */
const DEFAULT_VARIANT_TITLE = 'Default variant';

function getVariantLabel(product: ReturnedProduct) {
  const title = product.variant_title?.trim();
  if (
    !title ||
    title === DEFAULT_VARIANT_TITLE ||
    title === product.product_title
  ) {
    return null;
  }
  return title.split(' / ').join(' · ');
}

const columnHelper = createDataTableColumnHelper<ReturnedProduct>();

const columns = [
  columnHelper.accessor('product_title', {
    header: 'Product',
    enableSorting: true,
    sortLabel: 'Product',
    sortAscLabel: 'A-Z',
    sortDescLabel: 'Z-A',
    cell: ({ row }) => <ProductCell product={row.original} />,
  }),
  columnHelper.accessor('returned_quantity', {
    header: 'Returned quantity',
    enableSorting: true,
    sortLabel: 'Returned quantity',
    sortAscLabel: 'Low to High',
    sortDescLabel: 'High to Low',
  }),
  columnHelper.accessor('sold_quantity', {
    header: 'Sold quantity',
    enableSorting: true,
    sortLabel: 'Sold quantity',
    sortAscLabel: 'Low to High',
    sortDescLabel: 'High to Low',
  }),
  columnHelper.accessor('return_rate', {
    header: 'Return rate',
    enableSorting: true,
    sortLabel: 'Return rate',
    sortAscLabel: 'Low to High',
    sortDescLabel: 'High to Low',
    cell: ({ getValue }) => `${getValue()}%`,
  }),
  columnHelper.accessor('reasons', {
    header: 'Top reason',
    enableSorting: false,
    cell: ({ getValue }) => <TopReasonCell reasons={getValue()} />,
  }),
];

const ProductCell = ({ product }: { product: ReturnedProduct }) => {
  const variantLabel = getVariantLabel(product);
  return (
    <div className="flex items-center gap-x-3">
      <ProductThumbnail src={product.thumbnail} alt={product.product_title} />
      <div className="flex min-w-0 flex-col">
        <Text size="small" leading="compact" weight="plus" className="truncate">
          {product.product_title || '-'}
        </Text>
        {variantLabel && (
          <Text
            size="small"
            leading="compact"
            className="truncate text-ui-fg-subtle"
          >
            {variantLabel}
          </Text>
        )}
      </div>
    </div>
  );
};

/** "+N more" tooltip, like the Countries column in Medusa's Regions list. */
const TopReasonCell = ({
  reasons,
}: {
  reasons: ReturnedProduct['reasons'];
}) => {
  const [top, ...rest] = reasons;
  if (!top) {
    return '-';
  }

  return (
    <div className="flex items-center gap-x-1">
      <Text size="small" leading="compact" className="truncate">
        {top.name}
      </Text>
      {rest.length > 0 && (
        <Tooltip
          content={
            <div className="flex min-w-32 flex-col gap-y-1">
              {reasons.map((reason) => (
                <div
                  key={reason.name}
                  className="flex items-center justify-between gap-x-4"
                >
                  <Text size="xsmall" leading="compact">
                    {reason.name}
                  </Text>
                  <Text
                    size="xsmall"
                    leading="compact"
                    className="text-ui-fg-subtle"
                  >
                    {reason.quantity}
                  </Text>
                </div>
              ))}
            </div>
          }
        >
          <Text
            size="small"
            leading="compact"
            className="whitespace-nowrap text-ui-fg-subtle"
          >
            +{rest.length} more
          </Text>
        </Tooltip>
      )}
    </div>
  );
};

const PAGE_SIZE = 10;

export const ReturnedProductsTable: React.FC<ReturnedProductsTableProps> = ({
  products,
}) => {
  const [pagination, setPagination] = React.useState<DataTablePaginationState>({
    pageSize: PAGE_SIZE,
    pageIndex: 0,
  });

  const [search, setSearch] = React.useState<string>('');

  const [sorting, setSorting] = React.useState<DataTableSortingState | null>(
    null,
  );

  const navigate = useNavigate();

  // Without a sort, rows keep the API order (most returned first).
  const filteredProducts = React.useMemo(() => {
    const query = search.toLowerCase();
    let filtered = products.filter(
      (product) =>
        product.product_title.toLowerCase().includes(query) ||
        (product.variant_title ?? '').toLowerCase().includes(query) ||
        product.reasons.some((reason) =>
          reason.name.toLowerCase().includes(query),
        ),
    );

    if (sorting && sorting.id) {
      const id = sorting.id as keyof ReturnedProduct;
      const sortValue = (product: ReturnedProduct) =>
        id === 'product_title'
          ? `${product.product_title} ${product.variant_title ?? ''}`
          : product[id];
      filtered = filtered.slice().sort((a, b) => {
        const aVal = sortValue(a) ?? '';
        const bVal = sortValue(b) ?? '';
        const order =
          typeof aVal === 'string' && typeof bVal === 'string'
            ? aVal.localeCompare(bVal)
            : aVal < bVal
              ? -1
              : aVal > bVal
                ? 1
                : 0;
        return sorting.desc ? -order : order;
      });
    }

    return filtered;
  }, [products, search, sorting]);

  const shownProducts = React.useMemo(
    () =>
      filteredProducts.slice(
        pagination.pageIndex * pagination.pageSize,
        (pagination.pageIndex + 1) * pagination.pageSize,
      ),
    [filteredProducts, pagination],
  );

  const handleSearchChange = React.useCallback((value: string) => {
    setSearch(value);
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  }, []);

  // Keep the page in range when the list shrinks (e.g. a new date range).
  React.useEffect(() => {
    const lastPageIndex = Math.max(
      0,
      Math.ceil(filteredProducts.length / pagination.pageSize) - 1,
    );
    if (pagination.pageIndex > lastPageIndex) {
      setPagination((current) => ({ ...current, pageIndex: lastPageIndex }));
    }
  }, [filteredProducts.length, pagination.pageIndex, pagination.pageSize]);

  const table = useDataTable({
    columns,
    data: shownProducts,
    // Custom line items have no variant.
    getRowId: (product, index) =>
      product.variant_id ?? `${product.product_title}-${index}`,
    rowCount: filteredProducts.length,
    search: {
      state: search,
      onSearchChange: handleSearchChange,
    },
    pagination: {
      state: pagination,
      onPaginationChange: setPagination,
    },
    sorting: {
      state: sorting,
      onSortingChange: setSorting,
    },
    onRowClick: (_, row) => {
      // DataTable passes the TanStack row at runtime (typed as the data item).
      const { product_id, variant_id } = (
        row as unknown as { original: ReturnedProduct }
      ).original;
      if (product_id && variant_id) {
        navigate(`/products/${product_id}/variants/${variant_id}`);
      }
    },
  });

  return (
    // Don't rely on the dashboard providing one for the reason tooltips.
    <TooltipProvider>
      <DataTable instance={table}>
        <div className="flex items-center justify-end gap-2 mb-4">
          <DataTable.Search placeholder="Search..." />
          <DataTable.SortingMenu />
        </div>
        <DataTable.Table
          emptyState={{
            filtered: {
              heading: 'No returned products found',
            },
            empty: {
              heading: 'No returned products available',
            },
          }}
        />
        {filteredProducts.length > PAGE_SIZE && <DataTable.Pagination />}
      </DataTable>
    </TooltipProvider>
  );
};
