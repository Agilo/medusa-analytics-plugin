import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";
import { ProductVariantDTO } from "@medusajs/types";

const DEFAULT_THRESHOLD = 5;

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const productService = req.scope.resolve(Modules.PRODUCT);
  const inventoryService = req.scope.resolve(Modules.INVENTORY);
  const inventoryLevel = await inventoryService.listInventoryLevels(
    {
      stocked_quantity: { $lte: DEFAULT_THRESHOLD },
    },
    { select: ["id", "inventory_item_id", "stocked_quantity"] }
  );

  const inventoryItems = await inventoryService.listInventoryItems(
    {
      id: inventoryLevel.map((i) => i.inventory_item_id),
    },
    { select: ["id", "sku"] }
  );
  const productVariants = await productService.listProductVariants(
    {
      sku: inventoryItems
        .map((i) => i.sku)
        .filter((i) => i !== undefined && i !== null),
    },
    { select: ["id", "title", "sku"] }
  );

  const quantityByItemId = {};
  inventoryLevel.forEach((level) => {
    quantityByItemId[level.inventory_item_id] = level.stocked_quantity;
  });

  const quantityBySku = {};
  inventoryItems.forEach((item) => {
    if (item.sku) {
      quantityBySku[item.sku] = quantityByItemId[item.id];
    }
  });

  const lowStockVariants: {
    sku: string;
    variantName: string;
    inventoryQuantity: number;
  }[] = [];

  productVariants.forEach((variant) => {
    if (variant.sku) {
      const qty = quantityBySku[variant.sku];
      lowStockVariants.push({
        sku: variant.sku,
        inventoryQuantity: quantityBySku[variant.sku],
        variantName: variant.title,
      });
    }
  });
}
