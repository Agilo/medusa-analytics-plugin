import _ from "lodash";
import { BaseOrder } from "@medusajs/types/dist/http/order/common";

const DEAFULT_CURRENCY = "EUR";

export function getDateRange(start: string, end: string): string[] {
  const result: string[] = [];
  const current = new Date(start);
  const endDate = new Date(end);

  while (current <= endDate) {
    const dateStr = current.toISOString().split("T")[0];
    result.push(dateStr);
    current.setDate(current.getDate() + 1);
  }

  return result;
}