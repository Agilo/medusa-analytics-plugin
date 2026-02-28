import * as React from 'react';
import {
  createDataTableColumnHelper,
  useDataTable,
  DataTable,
  DataTablePaginationState,
  DataTableSortingState,
} from '@medusajs/ui';

import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

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
  createDataTableColumnHelper<CustomersTableProps['customers'][number]>();

const PAGE_SIZE = 10;

export const CustomersTable: React.FC<CustomersTableProps> = ({
  customers,
  currencyCode,
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
      columnHelper.accessor('name', {
        header: 'Name',
        enableSorting: true,
        sortLabel: 'Name',
        sortAscLabel: 'A-Z',
        sortDescLabel: 'Z-A',
      }),
      columnHelper.accessor('email', {
        header: 'Email',
        enableSorting: true,
        sortLabel: 'Email',
        sortAscLabel: 'A-Z',
        sortDescLabel: 'Z-A',
      }),
      columnHelper.accessor('order_count', {
        header: 'Order Count',
        enableSorting: true,
        sortLabel: 'Order Count',
        sortAscLabel: 'Low to High',
        sortDescLabel: 'High to Low',
      }),
      columnHelper.accessor('sales', {
        header: 'Total Sales',
        enableSorting: true,
        sortLabel: 'Total Sales',
        sortAscLabel: 'Low to High',
        sortDescLabel: 'High to Low',
        cell: ({ getValue }) => {
          const sales = getValue();
          return (
            <p>
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currencyCode || 'EUR',
              }).format(sales || 0)}
            </p>
          );
        },
      }),
      columnHelper.accessor('groups', {
        header: 'Groups',
        cell: ({ getValue }) => {
          const groups = getValue();
          return <p>{groups.length ? groups.join(', ') : 'No Group'}</p>;
        },
      }),
      columnHelper.accessor('last_order', {
        header: 'Last Order',
        enableSorting: true,
        sortLabel: 'Last Order',
        sortAscLabel: 'Oldest to Newest',
        sortDescLabel: 'Newest to Oldest',
        cell: ({ getValue }) => {
          const date = getValue();
          return (
            <p>
              {date ? format(new Date(date), 'MMM dd, yyyy') : 'No orders yet'}
            </p>
          );
        },
      }),
    ],
    [currencyCode],
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
      <div className="flex items-center justify-end gap-2 mb-4">
        <DataTable.Search placeholder="Search..." />
        <DataTable.SortingMenu />
      </div>
      <DataTable.Table
        emptyState={{
          filtered: {
            heading: 'No customers found',
          },
          empty: {
            heading: 'No customers available',
          },
        }}
      />
      {customers.length > PAGE_SIZE && <DataTable.Pagination />}
    </DataTable>
  );
};
