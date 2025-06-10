import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  BigNumber,
  ContainerRegistrationKeys,
} from "@medusajs/framework/utils";
import { z } from "zod";
import _ from "lodash";
import { getDateRange } from "../../../../utils/orders";

export const adminOrdersListQuerySchema = z.object({
  date_from: z.string(),
  date_to: z.string(),
});

const DEAFULT_CURRENCY = "EUR";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const validatedQuery = adminOrdersListQuerySchema.parse(req.query);
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const response = await fetch(
    "https://api.frankfurter.dev/v1/latest?base=DKK"
  );
  const exchangeRates = await response.json();

  const { data } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "total",
      "created_at",
      "status",
      "currency_code",
      "region.name",
    ],
    pagination: {
      order: {
        created_at: "asc",
      },
    },
    filters: {
      created_at: {
        $gte: validatedQuery.date_from,
        $lte: validatedQuery.date_to,
      },
      status: { $nin: ["draft"] },
    },
  });

  const dateRange = getDateRange(
    validatedQuery.date_from,
    validatedQuery.date_to
  );

  let regions: Record<string, number> = {};
  let totalSales = 0;
  let statuses: Record<string, number> = {};
  const groupedByDate: Record<
    string,
    { orderCount: number; totalAmount: number }
  > = {};

  data.forEach((order) => {
    const exchangeRate =
      order.currency_code.toUpperCase() !== DEAFULT_CURRENCY
        ? exchangeRates.rates[order.currency_code.toUpperCase()]
        : 1;
    const orderTotal = new BigNumber(order.total).numeric / exchangeRate;
    const date = new Date(order.created_at).toISOString().split("T")[0];

    if (!groupedByDate[date]) {
      groupedByDate[date] = { orderCount: 0, totalAmount: 0 };
    }
    groupedByDate[date].orderCount += 1;
    groupedByDate[date].totalAmount += orderTotal;

    totalSales += orderTotal;
    if (order.region?.name && regions[order?.region?.name]) {
      regions[order?.region?.name] += orderTotal;
    } else if (order.region?.name) {
      regions[order.region?.name] = orderTotal;
    }

    if (order.status) {
      if (statuses[order.status]) {
        statuses[order.status] += 1;
      } else {
        statuses[order.status] = 1;
      }
    }
  });

  const dateOrders = dateRange.map((date) => ({
    date,
    orderCount: groupedByDate[date]?.orderCount ?? 0,
    totalAmount: groupedByDate[date]?.totalAmount ?? 0,
  }));

  const orderData = {
    total_orders: data.length,
    regions,
    total_sales: totalSales,
    statuses,
    grouped_orders: dateOrders,
  };

  res.json({ data: orderData });
}
