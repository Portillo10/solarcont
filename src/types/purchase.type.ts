import { PurchaseItem } from "./purchase_item.type";

export type Purchase = {
  id: number;
  total: number;
  purchased_at: string;
  user_id?: number | null;
  supplier_id?: number | null;
};

export type PurchaseWithRelations = {
  purchase: Purchase;
  items: PurchaseItem[];
};
