import { getDB } from "@/config/db";
import { InventoryMovement } from "../types/inventory_movement.type";

//
// 🟢 CREATE MOVEMENT
//
export async function createInventoryMovement(
  movement: Omit<InventoryMovement, "id" | "created_at">,
  db?: Awaited<ReturnType<typeof getDB>>,
) {
  const database = db ?? (await getDB());

  const result = await database.execute(
    `INSERT INTO inventory_movements 
      (type, quantity, reference_id, reference_type, product_id, user_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      movement.type,
      movement.quantity,
      movement.reference_id ?? null,
      movement.reference_type ?? null,
      movement.product_id,
      movement.user_id ?? null,
    ],
  );

  return {
    id: result.lastInsertId,
    ...movement,
    created_at: new Date().toISOString(),
  };
}

//
// 🟢 GET STOCK (1 producto)
//
export async function getProductStock(productId: number): Promise<number> {
  const db = await getDB();

  const rows = await db.select<{ stock: number }[]>(
    `SELECT COALESCE(SUM(quantity), 0) as stock
     FROM inventory_movements
     WHERE product_id = ?`,
    [productId],
  );

  return rows[0]?.stock ?? 0;
}

//
// 🟢 GET STOCK (múltiples productos)
//
export async function getProductsStock(
  productIds: number[],
  db?: Awaited<ReturnType<typeof getDB>>,
): Promise<Record<number, number>> {
  const database = db ?? (await getDB());

  const stockMap: Record<number, number> = {};

  // inicializar en 0
  for (const id of productIds) {
    stockMap[id] = 0;
  }

  if (!productIds.length) {
    return stockMap;
  }

  const placeholders = productIds.map(() => "?").join(",");

  const rows = await database.select<{ product_id: number; stock: number }[]>(
    `SELECT product_id, COALESCE(SUM(quantity), 0) as stock
     FROM inventory_movements
     WHERE product_id IN (${placeholders})
     GROUP BY product_id;`,
    productIds,
  );

  for (const row of rows) {
    stockMap[row.product_id] = row.stock;
  }

  return stockMap;
}

//
// 🟢 GET MOVEMENTS BY PRODUCT
//
export async function getInventoryMovementsByProduct(
  productId: number,
): Promise<InventoryMovement[]> {
  const db = await getDB();

  return await db.select<InventoryMovement[]>(
    `SELECT *
     FROM inventory_movements
     WHERE product_id = ?
     ORDER BY id DESC`,
    [productId],
  );
}

//
// 🟢 GET ALL MOVEMENTS (opcional, útil para reportes)
//
export async function getInventoryMovements(): Promise<InventoryMovement[]> {
  const db = await getDB();

  return await db.select<InventoryMovement[]>(
    `SELECT *
     FROM inventory_movements
     ORDER BY id DESC`,
  );
}

//
// 🟢 DELETE MOVEMENTS BY REFERENCE
// (muy útil para borrar ventas/compras)
//
export async function deleteMovementsByReference(
  referenceId: number,
  referenceType: string,
) {
  const db = await getDB();

  await db.execute(
    `DELETE FROM inventory_movements
     WHERE reference_id = ?
       AND reference_type = ?`,
    [referenceId, referenceType],
  );

  return true;
}

export async function updateInventoryMovement(
  saleId: number,
  productId: number,
  updates: Partial<Omit<InventoryMovement, "id" | "created_at">>,
  db?: Awaited<ReturnType<typeof getDB>>,
) {
  const database = db ?? (await getDB());

  const existing = await database.select<InventoryMovement[]>(
    `SELECT * FROM inventory_movements
     WHERE reference_id = ?
       AND reference_type = 'sale'
       AND product_id = ?
     LIMIT 1`,
    [saleId, productId],
  );

  if (!existing.length) {
    throw new Error(
      `No inventory movement found for sale_id=${saleId} product_id=${productId}`,
    );
  }

  const current = existing[0];

  await database.execute(
    `UPDATE inventory_movements SET
      type           = COALESCE(?, type),
      quantity       = COALESCE(?, quantity),
      reference_id   = COALESCE(?, reference_id),
      reference_type = COALESCE(?, reference_type),
      user_id        = COALESCE(?, user_id)
     WHERE reference_id = ?
       AND reference_type = 'sale'
       AND product_id = ?`,
    [
      updates.type ?? null,
      updates.quantity ?? null,
      updates.reference_id ?? null,
      updates.reference_type ?? null,
      updates.user_id ?? null,
      saleId,
      productId,
    ],
  );

  return {
    ...current,
    ...updates,
  };
}
