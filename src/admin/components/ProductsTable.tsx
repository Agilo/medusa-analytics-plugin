import * as React from "react";
import {
  createDataTableColumnHelper,
  useDataTable,
  DataTable,
  DataTablePaginationState,
  DataTableSortingState,
} from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import { cn } from "../lib/utils";
import { useNavigate } from "react-router-dom";

type ProductsTableProps = {
  products: {
    sku: string;
    variantName: string;
    inventoryQuantity: number;
    variantId: string;
    productId: string;
  }[];
};

const columnHelper =
  createDataTableColumnHelper<ProductsTableProps["products"][0]>();

const PAGE_SIZE = 10;

export const ProductsTable: React.FC<ProductsTableProps> = ({ products }) => {
  const { t } = useTranslation();

  const [pagination, setPagination] = React.useState<DataTablePaginationState>({
    pageSize: PAGE_SIZE,
    pageIndex: 0,
  });

  const [search, setSearch] = React.useState<string>("");

  const [sorting, setSorting] = React.useState<DataTableSortingState | null>(
    null,
  );

  const navigate = useNavigate();

  const columns = React.useMemo(
    () => [
      columnHelper.accessor("sku", {
        header: t("analytics.table.products.sku"),
        enableSorting: true,
        sortLabel: t("analytics.table.products.sku"),
        sortAscLabel: t("analytics.table.products.sortAZ"),
        sortDescLabel: t("analytics.table.products.sortZA"),
      }),
      columnHelper.accessor("variantName", {
        header: t("analytics.table.products.variantName"),
        enableSorting: true,
        sortLabel: t("analytics.table.products.variantName"),
        sortAscLabel: t("analytics.table.products.sortAZ"),
        sortDescLabel: t("analytics.table.products.sortZA"),
      }),
      columnHelper.accessor("inventoryQuantity", {
        header: t("analytics.table.products.inventory"),
        enableSorting: true,
        sortLabel: t("analytics.table.products.inventory"),
        sortAscLabel: t("analytics.table.products.sortLowHigh"),
        sortDescLabel: t("analytics.table.products.sortHighLow"),
        cell: ({ getValue }) => {
          const value = getValue();

          return (
            <p className={cn(value === 0 && "text-ui-fg-error")}>
              {value === 0 ? t("analytics.products.outOfStockLabel") : value}
            </p>
          );
        },
      }),
    ],
    [t],
  );

  const shownProducts = React.useMemo(() => {
    let filtered = products.filter(
      (product) =>
        product.variantName.toLowerCase().includes(search.toLowerCase()) ||
        product.sku.toLowerCase().includes(search.toLowerCase()),
    );

    if (sorting && sorting.id) {
      filtered = filtered.slice().sort((a, b) => {
        // @ts-expect-error - TypeScript does not know the type of sorting.id
        const aVal = a[sorting.id];
        // @ts-expect-error - TypeScript does not know the type of sorting.id
        const bVal = b[sorting.id];
        if (aVal < bVal) {
          return sorting.desc ? 1 : -1;
        }
        if (aVal > bVal) {
          return sorting.desc ? -1 : 1;
        }
        return 0;
      });
    }

    return filtered.slice(
      pagination.pageIndex * pagination.pageSize,
      (pagination.pageIndex + 1) * pagination.pageSize,
    );
  }, [products, search, sorting, pagination]);

  const table = useDataTable({
    columns,
    data: shownProducts,
    getRowId: (product) => product.sku,
    rowCount: products.length,
    search: {
      state: search,
      onSearchChange: setSearch,
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      navigate(
        `/products/${(row as any).original.productId}/variants/${(row as any).original.variantId}`,
      );
    },
  });

  return (
    <DataTable instance={table}>
      <DataTable.Toolbar className="px-0 pt-0">
        <DataTable.Search placeholder={t("analytics.table.search")} />
      </DataTable.Toolbar>
      <DataTable.Table
        emptyState={{
          filtered: {
            heading: t("analytics.table.products.noProductsFound"),
          },
          empty: {
            heading: t("analytics.table.products.noProductsAvailable"),
          },
        }}
      />
      {products.length > PAGE_SIZE && <DataTable.Pagination />}
    </DataTable>
  );
};
