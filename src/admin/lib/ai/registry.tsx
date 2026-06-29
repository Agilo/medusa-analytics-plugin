import * as React from 'react';
import { defineRegistry } from '@json-render/react';
import { Table, Text as UiText } from '@medusajs/ui';
import { ShoppingCart, User, FlyingBox } from '@medusajs/icons';
import { ChartNoAxesCombined } from 'lucide-react';
import { catalog } from './catalog';
import { LineChart } from '../../components/LineChart';
import { BarChart } from '../../components/BarChart';
import { PieChart } from '../../components/PieChart';
import { StackedBarChart } from '../../components/StackedBarChart';
import {
  StatCard as UIStatCard,
  ChartPanelCard,
  PanelCard,
} from '../../components/AnalyticsPanelCards';

const GRID_COLS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
};

const STAT_ICONS: Record<string, React.ReactNode> = {
  orders: <ShoppingCart />,
  sales: <ChartNoAxesCombined className="size-[15px]" />,
  customers: <User />,
  products: <FlyingBox />,
};

/**
 * Maps the catalog's component names to the plugin's existing, reusable
 * analytics components. The AI generates a json-render spec referencing these
 * names; <Renderer> walks the spec and renders these.
 */
export const { registry } = defineRegistry(catalog, {
  components: {
    Dashboard: ({ children }) => (
      <div className="flex flex-col gap-4">{children}</div>
    ),

    Grid: ({ props, children }) => (
      <div className={`grid gap-4 ${GRID_COLS[props.columns ?? 2]}`}>
        {children}
      </div>
    ),

    StatCard: ({ props }) => (
      <UIStatCard
        label={props.label}
        value={props.value}
        trend={props.trend ?? undefined}
        icon={props.icon ? STAT_ICONS[props.icon] : undefined}
        isLoading={false}
      />
    ),

    ChartCard: ({ props, children }) => (
      <ChartPanelCard
        title={props.title}
        description={props.description ?? undefined}
        isLoading={false}
        isError={false}
      >
        {children}
      </ChartPanelCard>
    ),

    Card: ({ props, children }) => (
      <PanelCard
        title={props.title}
        description={props.description ?? undefined}
      >
        {children}
      </PanelCard>
    ),

    LineChart: ({ props }) => (
      <LineChart
        data={props.data}
        xAxisDataKey={props.xKey}
        yAxisDataKey={props.yKey}
        lineColor={props.color ?? undefined}
      />
    ),

    BarChart: ({ props }) => (
      <BarChart
        data={props.data}
        xAxisDataKey={props.xKey}
        yAxisDataKey={props.yKey}
        isHorizontal={props.horizontal}
        useStableColors
        colorKeyField={props.xKey}
      />
    ),

    PieChart: ({ props }) => {
      const data = (props.data ?? []).map((row) => ({
        name: String(row[props.nameKey]),
        value: Number(row[props.valueKey]),
      }));
      return <PieChart data={data} dataKey="value" />;
    },

    StackedBarChart: ({ props }) => (
      <StackedBarChart
        data={props.data}
        xAxisDataKey={props.xKey}
        dataKeys={props.seriesKeys}
        useStableColors
        colorKeyField={props.xKey}
      />
    ),

    Table: ({ props }) => (
      <Table>
        <Table.Header>
          <Table.Row>
            {props.columns.map((col) => (
              <Table.HeaderCell key={col.key}>{col.label}</Table.HeaderCell>
            ))}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {props.rows.map((row, index) => (
            <Table.Row key={index}>
              {props.columns.map((col) => (
                <Table.Cell key={col.key}>
                  {row[col.key] !== undefined && row[col.key] !== null
                    ? String(row[col.key])
                    : '—'}
                </Table.Cell>
              ))}
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    ),

    Text: ({ props }) => (
      <UiText
        size="small"
        className={props.muted ? 'text-ui-fg-muted' : undefined}
      >
        {props.content}
      </UiText>
    ),
  },
});
