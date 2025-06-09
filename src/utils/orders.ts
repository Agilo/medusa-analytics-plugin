import _ from "lodash";
import { BaseOrder } from "@medusajs/types/dist/http/order/common";

export function generatePeriods(
  dateFrom: string,
  dateTo: string,
  period: string
) {
  const periods: string[] = [];
  const start = new Date(dateFrom);
  const end = new Date(dateTo);

  const current = new Date(start);

  while (current <= end) {
    let periodKey: string = "";

    switch (period) {
      case "day":
        periodKey = current.toISOString().split("T")[0];
        current.setDate(current.getDate() + 1);
        break;

      case "week":
        const startOfWeek = new Date(current);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);

        periodKey = startOfWeek.toISOString().split("T")[0];
        current.setDate(current.getDate() + 7);
        break;

      case "month":
        periodKey = `${current.getFullYear()}-${String(
          current.getMonth() + 1
        ).padStart(2, "0")}`;
        current.setMonth(current.getMonth() + 1);
        break;

      case "year":
        periodKey = current.getFullYear().toString();
        current.setFullYear(current.getFullYear() + 1);
        break;
    }

    periods.push(periodKey);
  }

  return [...new Set(periods)];
}

export function groupOrdersByPeriodComplete(
  orders: BaseOrder[],
  dateFrom: string,
  dateTo: string,
  period = "week",
  exchangeRates: any
) {
  const allPeriods = generatePeriods(dateFrom, dateTo, period) as string[];

  const grouped = _.groupBy(orders, (order) => {
    const date = new Date(order.created_at);

    switch (period) {
      case "day":
        return date.toISOString().split("T")[0];
      case "week":
        const startOfWeek = new Date(date);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
        startOfWeek.setDate(diff);
        return startOfWeek.toISOString().split("T")[0];
      case "month":
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
          2,
          "0"
        )}`;
      case "year":
        return date.getFullYear().toString();
      default:
        return date.toISOString().split("T")[0];
    }
  });

  return allPeriods.map((periodKey) => {
    const periodOrders = grouped[periodKey] || [];

    const totalRevenue = periodOrders.reduce((sum, order) => {
      const exchangeRate =
        order.currency_code.toUpperCase() !== "DKK"
          ? exchangeRates.rates[order.currency_code.toUpperCase()]
          : 1;

      const convertedTotal = order.total / exchangeRate;
      return sum + convertedTotal;
    }, 0);

    return {
      period: periodKey,
      totalRevenue: Math.floor(totalRevenue * 100) / 100,
      orderCount: periodOrders.length,
      orders: periodOrders,
    };
  });
}

export const calculatePeriodDays = (dateFrom: string, dateTo: string) => {
  const startDate = new Date(dateFrom);
  const endDate = new Date(dateTo);
  const diffTime = endDate.getTime() - startDate.getTime();

  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  return diffDays;
};
