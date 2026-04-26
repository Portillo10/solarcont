import { getDB } from "@/config/db";
import { Purchase } from "../types/purchase.type";
import { PurchaseItem } from "../types/purchase_item.type";

export async function savePurchase(
  purchase: Purchase,
  purchasItems: PurchaseItem[],
) {
  const db = await getDB();

  await db.execute(
    `INSERT INTO purchases (total, user_id, supplier_id)
     VALUES (?, ?, ?)`,
    [purchase.total, purchase.user_id ?? null, purchase.supplier_id ?? null],
  );
}
