export type InventoryMovementType = "IN" | "OUT";

export type InventoryMovement = {
  id: number;
  type: InventoryMovementType;
  quantity: number;
  reference_id?: number | null;
  reference_type?: string | null;
  created_at: string;
  product_id: number;
  user_id?: number | null;
};
