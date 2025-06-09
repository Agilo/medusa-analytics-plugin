import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  BigNumber,
  ContainerRegistrationKeys,
} from "@medusajs/framework/utils";
import { z } from "zod";
import _ from "lodash";

export const adminOrdersListQuerySchema = z.object({
  date_from: z.string(),
  date_to: z.string(),
});

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

  let regions: Record<string, number> = {};
  let totalSales = 0;
  let statuses: Record<string, number> = {};

  data.forEach((order) => {
    const exchangeRate =
      order.currency_code.toUpperCase() !== "DKK"
        ? exchangeRates.rates[order.currency_code.toUpperCase()]
        : 1;
    const orderTotal = new BigNumber(order.total).numeric / exchangeRate;
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

  const orderData = {
    total_orders: data.length,
    regions,
    total_sales: totalSales,
    statuses,
  };

  res.json({ data: orderData });
}