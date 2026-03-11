import * as React from "react";
import {
  createDataTableColumnHelper,
  useDataTable,
  DataTable,
  DataTablePaginationState,
  DataTableSortingState,
} from "@medusajs/ui";

import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

type CustomersTableProps = {
  customers: {
    customer_id: string;
    name: string;
    email: string;
    order_count: number;
    sales: number;
    last_order: Date | null;
    groups: string[];
  }[];
  currencyCode: string;
};

const columnHelper =
  createDataTableColumnHelper<CustomersTableProps["customers"][number]>();

const PAGE_SIZE = 10;

export const CustomersTable: React.FC<CustomersTableProps> = ({
  customers,
  currencyCode,
}) => {
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

  const shownCustomers = React.useMemo(() => {
    let filtered = customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(search.toLowerCase()) ||
        customer.email.toLowerCase().includes(search.toLowerCase()),
    );

    if (sorting && sorting.id) {
      filtered = filtered.slice().sort((a, b) => {
        const aVal = a[sorting.id as keyof typeof a];

        const bVal = b[sorting.id as keyof typeof b];
        if (!aVal && !bVal) return 0;

        if (!aVal) return sorting.desc ? 1 : -1;
        if (!bVal) return sorting.desc ? -1 : 1;

        if (aVal < bVal) return sorting.desc ? 1 : -1;
        if (aVal > bVal) return sorting.desc ? -1 : 1;
        return 0;
      });
    }

    return filtered.slice(
      pagination.pageIndex * pagination.pageSize,
      (pagination.pageIndex + 1) * pagination.pageSize,
    );
  }, [customers, search, sorting, pagination]);

  const columns = React.useMemo(
    () => [
      columnHelper.accessor("name", {
        header: t("analytics.table.customers.name"),
        enableSorting: true,
        sortLabel: t("analytics.table.customers.name"),
        sortAscLabel: t("analytics.table.customers.sortAZ"),
        sortDescLabel: t("analytics.table.customers.sortZA"),
      }),
      columnHelper.accessor("email", {
        header: t("analytics.table.customers.email"),
        enableSorting: true,
        sortLabel: t("analytics.table.customers.email"),
        sortAscLabel: t("analytics.table.customers.sortAZ"),
        sortDescLabel: t("analytics.table.customers.sortZA"),
      }),
      columnHelper.accessor("order_count", {
        header: t("analytics.table.customers.orderCount"),
        enableSorting: true,
        sortLabel: t("analytics.table.customers.orderCount"),
        sortAscLabel: t("analytics.table.customers.sortLowHigh"),
        sortDescLabel: t("analytics.table.customers.sortHighLow"),
      }),
      columnHelper.accessor("sales", {
        header: t("analytics.table.customers.totalSales"),
        enableSorting: true,
        sortLabel: t("analytics.table.customers.totalSales"),
        sortAscLabel: t("analytics.table.customers.sortLowHigh"),
        sortDescLabel: t("analytics.table.customers.sortHighLow"),
        cell: ({ getValue }) => {
          const sales = getValue();
          return (
            <p>
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: currencyCode || "EUR",
              }).format(sales || 0)}
            </p>
          );
        },
      }),
      columnHelper.accessor("groups", {
        header: t("analytics.table.customers.groups"),
        cell: ({ getValue }) => {
          const groups = getValue();
          return (
            <p>
              {groups.length
                ? groups.join(", ")
                : t("analytics.table.customers.noGroup")}
            </p>
          );
        },
      }),
      columnHelper.accessor("last_order", {
        header: t("analytics.table.customers.lastOrder"),
        enableSorting: true,
        sortLabel: t("analytics.table.customers.lastOrder"),
        sortAscLabel: t("analytics.table.customers.sortOldNew"),
        sortDescLabel: t("analytics.table.customers.sortNewOld"),
        cell: ({ getValue }) => {
          const date = getValue();
          return (
            <p>
              {date
                ? format(new Date(date), "MMM dd, yyyy")
                : t("analytics.table.customers.noOrders")}
            </p>
          );
        },
      }),
    ],
    [currencyCode, t],
  );

  const table = useDataTable({
    columns,
    data: shownCustomers,
    getRowId: (customer) => customer.customer_id,
    rowCount: customers.length,
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
      // @ts-expect-error
      navigate(`/customers/${row.original.customer_id}`);
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
            heading: t("analytics.table.customers.noCustomersFound"),
          },
          empty: {
            heading: t("analytics.table.customers.noCustomersAvailable"),
          },
        }}
      />
      {customers.length > PAGE_SIZE && <DataTable.Pagination />}
    </DataTable>
  );
};
