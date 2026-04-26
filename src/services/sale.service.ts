//sale.service
import { getDB } from "@/config/db";
import { Sale, SaleStatus, SaleWithRelations } from "../types/sale.type";
import { SaleItem } from "../types/sale_item.type";
import { Payment } from "../types/payment.type";
import { getProductsStock, updateInventoryMovement } from "./inventory.service";
import { convertToISO, formatDate } from "../lib/formatter";

async function executeWithRetry(
  db: any,
  query: string,
  params: any[] = [],
  retries = 5,
) {
  for (let i = 0; i < retries; i++) {
    try {
      return await db.execute(query, params);
    } catch (e: any) {
      if (
        e?.message?.includes("database is locked") ||
        e?.message?.includes("SQLITE_BUSY")
      ) {
        await new Promise((r) => setTimeout(r, 50 * (i + 1)));
        continue;
      }
      throw e;
    }
  }
  throw new Error("DB_LOCK_TIMEOUT");
}

//
// 🟢 TYPES (DTOs)
//
export type CreateSaleInput = {
  total: number;
  status?: SaleStatus;
  sold_at?: string;
  hidden?: number;
  user_id?: number | null;
  customer_document?: number | null;
  customer_name?: string | null;

  items: (Omit<SaleItem, "id" | "sale_id"> & {
    id?: number;
    sale_id?: number;
  })[];
  payment: Omit<Payment, "id" | "sale_id" | "paid_at">;
};

export type UpdateSaleInput = Partial<
  CreateSaleInput & { customer_id?: number | null }
>;

async function insertSale(
  db: Awaited<ReturnType<typeof getDB>>,
  input: CreateSaleInput & { customer_id?: number | null },
) {
  const dateParam = input.sold_at
    ? formatDate(input.sold_at)
    : new Date().toISOString();

  const result = await db.execute(
    `INSERT INTO sales 
        (total, status, sold_at, user_id, customer_id)
       VALUES (?, ?, ?, ?, ?)`,
    [
      input.total ?? 0,
      input.status ?? "PENDING",
      dateParam,
      input.user_id ?? null,
      input.customer_id ?? null,
    ],
  );
  return result;
}

let isCreatingSale = false;

export async function createSale(
  input: CreateSaleInput & { customer_id?: number | null },
) {
  if (isCreatingSale) {
    throw new Error("OPERATION_IN_PROGRESS");
  }

  isCreatingSale = true;

  const db = await getDB();

  try {
    const validItems = input.items.filter(
      (i) => i.product_id && i.quantity > 0,
    );

    if (!validItems.length) {
      throw new Error("NO_ITEMS");
    }

    const dateParam = input.sold_at ?? new Date().toISOString();

    // 🟢 1. VALIDAR STOCK
    const productIds = validItems.map((i) => i.product_id!);
    const stockMap = await getProductsStock(productIds, db);

    const grouped = new Map<number, number>();

    for (const item of validItems) {
      grouped.set(
        item.product_id!,
        (grouped.get(item.product_id!) ?? 0) + item.quantity,
      );
    }

    for (const [productId, qty] of grouped) {
      const stock = stockMap[productId] ?? 0;

      if (stock < qty) {
        throw new Error(`INSUFFICIENT_STOCK_${productId}`);
      }
    }

    // 🟢 2. CREAR VENTA
    const saleResult = await db.execute(
      `INSERT INTO sales 
        (total, status, sold_at, user_id, customer_id)
       VALUES (?, ?, ?, ?, ?)`,
      [
        input.total ?? 0,
        input.status ?? "PENDING",
        dateParam,
        input.user_id ?? null,
        input.customer_id ?? null,
      ],
    );

    const saleId = saleResult.lastInsertId;

    if (!saleId) {
      throw new Error("FAILED_TO_CREATE_SALE");
    }

    // 🟢 3. INSERTAR ITEMS
    const itemPlaceholders = validItems.map(() => "(?, ?, ?, ?, ?)").join(", ");

    const itemValues: any[] = [];

    for (const item of validItems) {
      itemValues.push(
        saleId,
        item.product_id,
        item.quantity,
        item.unit_price,
        item.purchase_price,
      );
    }

    await db.execute(
      `INSERT INTO sale_items
        (sale_id, product_id, quantity, unit_price, purchase_price)
       VALUES ${itemPlaceholders}`,
      itemValues,
    );

    // 🟢 4. INVENTORY MOVEMENTS
    const movementPlaceholders = validItems
      .map(() => "(?, ?, ?, ?, ?)")
      .join(", ");

    const movementValues: any[] = [];

    for (const item of validItems) {
      movementValues.push(
        "OUT",
        saleId,
        "sale",
        item.product_id,
        item.quantity * -1,
      );
    }

    await db.execute(
      `INSERT INTO inventory_movements
        (type, reference_id, reference_type, product_id, quantity)
       VALUES ${movementPlaceholders}`,
      movementValues,
    );

    // 🟢 5. PAYMENT
    if (input.payment?.amount > 0) {
      await db.execute(
        `INSERT INTO payments (sale_id, amount, method)
         VALUES (?, ?, ?)`,
        [saleId, input.payment.amount, input.payment.method],
      );
    }

    return saleId;
  } finally {
    isCreatingSale = false;
  }
}

//
// 🟢 CREATE
//
// export async function createSale(
//   input: CreateSaleInput & { customer_id?: number | null },
// ): Promise<SaleWithRelations> {
//   const db = await getDB();
//   console.log("Iniciando transacción");
//   const productIds = Array.from(input.items.map((item) => item.product_id));
//   const stockMap = await getProductsStock(productIds);

//   await db.execute("BEGIN IMMEDIATE;"); // 🔥 mejor que BEGIN normal
//   console.log("transacción iniciada");

//   try {
//     //
//     // 🟢 1. Crear venta
//     //
//     const dateParam = input.sold_at
//       ? formatDate(input.sold_at)
//       : new Date().toISOString();

//     const result = await db.execute(
//       `INSERT INTO sales
//         (total, status, sold_at, user_id, customer_id)
//        VALUES (?, ?, ?, ?, ?);`,
//       [
//         input.total ?? 0,
//         input.status ?? "PENDING",
//         dateParam,
//         input.user_id ?? null,
//         input.customer_id ?? null,
//       ],
//     );
//     const saleId = result.lastInsertId;

//     console.log("venta creada");
//     if (!saleId) {
//       throw new Error("FAILED_TO_CREATE_SALE");
//     }

//     //
//     // 🟢 2. Validar y agrupar items
//     //
//     const validItems = input.items.filter(
//       (i) => i.product_id && i.quantity > 0,
//     );

//     if (validItems.length > 0) {
//       //
//       // 🔹 agrupar cantidades por producto (por si vienen repetidos)
//       //
//       const quantityByProduct = new Map<number, number>();

//       for (const item of validItems) {
//         const prev = quantityByProduct.get(item.product_id!) ?? 0;
//         quantityByProduct.set(item.product_id!, prev + item.quantity);
//       }

//       //
//       // 🔹 validar stock correctamente
//       //
//       for (const [productId, totalQty] of quantityByProduct) {
//         const stock = stockMap[productId] ?? 0;

//         if (stock < totalQty) {
//           throw new Error(`INSUFFICIENT_STOCK_PRODUCT_${productId}`);
//         }
//       }

//       //
//       // 🟢 3. Insert batch sale_items
//       //
//       const itemPlaceholders = validItems
//         .map(() => "(?, ?, ?, ?, ?)")
//         .join(", ");

//       const itemValues: any[] = [];

//       for (const item of validItems) {
//         itemValues.push(
//           saleId,
//           item.product_id,
//           item.quantity,
//           item.unit_price,
//           item.purchase_price,
//         );
//       }

//       await db.execute(
//         `INSERT INTO sale_items
//           (sale_id, product_id, quantity, unit_price, purchase_price)
//          VALUES ${itemPlaceholders}`,
//         itemValues,
//       );
//       console.log("productos insertados");

//       //
//       // 🟢 4. Insert batch inventory movements
//       //
//       const movementPlaceholders = validItems
//         .map(() => "(?, ?, ?, ?, ?)")
//         .join(", ");

//       const movementValues: any[] = [];

//       for (const item of validItems) {
//         movementValues.push(
//           "OUT",
//           saleId,
//           "sale",
//           item.product_id,
//           item.quantity * -1,
//         );
//       }

//       await db.execute(
//         `INSERT INTO inventory_movements
//           (type, reference_id, reference_type, product_id, quantity)
//          VALUES ${movementPlaceholders}`,
//         movementValues,
//       );
//     }
//     console.log("inventory insertados");

//     //
//     // 🟢 5. Insert pago (simple, no necesita batch)
//     //
//     const { payment } = input;

//     if (payment?.amount > 0) {
//       await db.execute(
//         `INSERT INTO payments (sale_id, amount, method)
//          VALUES (?, ?, ?)`,
//         [saleId, payment.amount, payment.method],
//       );
//     }
//     console.log("pago insertados");

//     //
//     // 🟢 6. Commit
//     //
//     await db.execute("COMMIT;");
//     console.log("commit");

//     //
//     // 🟢 7. Retornar
//     //
//     return await getSaleWithRelations(saleId);
//   } catch (error) {
//     console.log("Error insertando venta");
//     console.log(error);
//     try {
//       await db.execute("ROLLBACK;");
//     } catch {}

//     throw error;
//   }
// }

//
// 🟢 GET ALL
//
export async function getSales(): Promise<Sale[]> {
  const db = await getDB();

  return await db.select<Sale[]>(`SELECT * FROM sales ORDER BY id DESC`);
}

//
// 🟢 GET BY ID
//
export async function getSaleById(id: number): Promise<Sale> {
  const db = await getDB();

  const rows = await db.select<Sale[]>(`SELECT * FROM sales WHERE id = ?`, [
    id,
  ]);

  if (!rows.length) {
    throw new Error("Sale not found");
  }

  return rows[0];
}

//
// 🟢 UPDATE
//
export async function updateSale(
  id: number,
  input: UpdateSaleInput,
): Promise<SaleWithRelations> {
  const db = await getDB();

  const existing = await db.select<Sale[]>(`SELECT * FROM sales WHERE id = ?`, [
    id,
  ]);

  if (!existing.length) {
    throw new Error("Sale not found");
  }

  const dateParam = convertToISO(input.sold_at);

  try {
    //
    // 🟢 1. actualizar venta
    //
    await db.execute(
      `UPDATE sales SET
        total = COALESCE(?, total),
        status = COALESCE(?, status),
        sold_at = COALESCE(?, sold_at),
        hidden = COALESCE(?, hidden),
        user_id = COALESCE(?, user_id),
        customer_id = COALESCE(?, customer_id)
       WHERE id = ?`,
      [
        input.total ?? null,
        input.status ?? null,
        dateParam ?? null,
        input.hidden ?? null,
        input.user_id ?? null,
        input.customer_id ?? null,
        id,
      ],
    );

    //
    // 🟢 2. actualizar items (si vienen)
    //
    if (input.items) {
      // traer items actuales
      const existingItems = await db.select<SaleItem[]>(
        `SELECT * FROM sale_items WHERE sale_id = ?`,
        [id],
      );

      const existingMap = new Map(existingItems.map((i) => [i.id, i]));

      const incomingIds = new Set<number>();

      //
      // 🔹 upsert (update o insert)
      //
      for (const item of input.items) {
        if (item.id && existingMap.has(item.id)) {
          // update
          await db.execute(
            `UPDATE sale_items SET
              product_id = COALESCE(?, product_id),
              quantity = COALESCE(?, quantity),
              unit_price = COALESCE(?, unit_price)
             WHERE id = ?`,
            [
              item.product_id ?? null,
              item.quantity ?? null,
              item.unit_price ?? null,
              item.id,
            ],
          );

          if (item.sale_id) {
            await updateInventoryMovement(
              item.sale_id,
              item.product_id,
              { quantity: item.quantity * -1 },
              db,
            );
          }
          incomingIds.add(item.id);
        } else {
          // insert nuevo
          const result = await db.execute(
            `INSERT INTO sale_items (sale_id, product_id, quantity, unit_price)
             VALUES (?, ?, ?, ?)`,
            [id, item.product_id, item.quantity, item.unit_price],
          );

          if (result.lastInsertId) {
            incomingIds.add(result.lastInsertId);
          }
        }
      }

      //
      // 🔹 eliminar los que ya no vienen
      //
      for (const existingItem of existingItems) {
        if (!incomingIds.has(existingItem.id)) {
          await db.execute(`DELETE FROM sale_items WHERE id = ?`, [
            existingItem.id,
          ]);
        }
      }
    }

    //
    // 🟢 3. commit
    //

    //
    // 🟢 4. devolver con relaciones
    //
    return await getSaleWithRelations(id);
  } catch (error) {
    throw error;
  }
}

//
// 🟢 DELETE (hard delete)
//
//
// 🔴 DELETE (cascade manual con transacción)
//
export async function deleteSale(id: number) {
  const db = await getDB();

  try {
    // 1. Verificar que la venta existe
    const existing = await db.select<Sale[]>(
      `SELECT id FROM sales WHERE id = ?`,
      [id],
    );

    if (!existing.length) {
      throw new Error("Sale not found");
    }

    // 2. Eliminar movimientos de inventario asociados
    await db.execute(
      `DELETE FROM inventory_movements
       WHERE reference_id = ?
         AND reference_type = 'sale'`,
      [id],
    );

    // 3. Eliminar items de la venta
    await db.execute(`DELETE FROM sale_items WHERE sale_id = ?`, [id]);

    // 4. Eliminar pagos asociados
    await db.execute(`DELETE FROM payments WHERE sale_id = ?`, [id]);

    // 5. Eliminar la venta
    await db.execute(`DELETE FROM sales WHERE id = ?`, [id]);

    return true;
  } catch (error) {
    console.log("Error deleting sale");
    console.log(error);
    throw error;
  }
}

//
// 🟢 GET WITH RELATIONS
//
export async function getSaleWithRelations(
  id: number,
  database?: Awaited<ReturnType<typeof getDB>>,
): Promise<SaleWithRelations> {
  const db = database ?? (await getDB());

  const sale = await getSaleById(id);

  const items = await db.select<SaleItem[]>(
    `SELECT * FROM sale_items WHERE sale_id = ?`,
    [id],
  );

  const payments = await db.select<Payment[]>(
    `SELECT * FROM payments WHERE sale_id = ?`,
    [id],
  );

  return {
    sale,
    items,
    payments,
  };
}

//
// 🟢 GET ALL WITH RELATIONS
//
export async function getSalesWithRelations(): Promise<SaleWithRelations[]> {
  const sales = await getSales();

  const db = await getDB();

  const result: SaleWithRelations[] = [];

  for (const sale of sales) {
    const items = await db.select<SaleItem[]>(
      `SELECT * FROM sale_items WHERE sale_id = ?`,
      [sale.id],
    );

    const payments = await db.select<Payment[]>(
      `SELECT * FROM payments WHERE sale_id = ?`,
      [sale.id],
    );

    result.push({
      sale,
      items,
      payments,
    });
  }

  return result;
}

export type SalesOverview = {
  total_sales: number;
  total_amount: number;
  total_paid: number;
  total_pending: number;
  pending_count: number;
};

export async function getSalesOverview(
  user_id?: number | null,
  dateFrom?: string,
  dateTo?: string,
): Promise<SalesOverview> {
  const db = await getDB();

  const conditions: string[] = [];
  const params: (string | number)[] = [];

  //
  // 🟢 filtro por usuario
  //
  if (user_id != null) {
    conditions.push("user_id = ?");
    params.push(user_id);
  }

  //
  // 🟢 rango de fechas (usando sold_at)
  //
  if (dateFrom && dateTo) {
    conditions.push("sold_at BETWEEN ? AND ?");
    params.push(dateFrom, dateTo);
  } else if (dateFrom) {
    conditions.push("sold_at >= ?");
    params.push(dateFrom);
  } else if (dateTo) {
    conditions.push("sold_at <= ?");
    params.push(dateTo);
  } else {
    // 🔥 default: últimos 30 días
    conditions.push(`sold_at >= datetime('now', '-30 days')`);
  }

  //
  // 🟢 construir WHERE
  //
  const where =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const rows = await db.select<
    {
      total_sales: number;
      total_amount: number;
      total_paid: number;
      total_pending: number;
      pending_count: number;
    }[]
  >(
    `
    SELECT
      COUNT(*) as total_sales,

      COALESCE(SUM(total), 0) as total_amount,

      COALESCE(SUM(total_paid), 0) as total_paid,

      COALESCE(SUM(total - total_paid), 0) as total_pending,

      COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_count

    FROM sales_with_summary
    ${where}
    `,
    params,
  );

  const r = rows[0];

  return {
    total_sales: r?.total_sales ?? 0,
    total_amount: r?.total_amount ?? 0,
    total_paid: r?.total_paid ?? 0,
    total_pending: r?.total_pending ?? 0,
    pending_count: r?.pending_count ?? 0,
  };
}

export type GetPaginatedSalesParams = {
  page?: number;
  pageSize?: number;
  user_id?: number | null;
  search?: string;

  dateFrom?: string;
  dateTo?: string;
};

export type PaginatedSales = {
  data: any[];
  total: number;
  page: number;
  pageSize: number;
};

export async function getPaginatedSales(
  params: GetPaginatedSalesParams,
): Promise<{ data: SaleWithRelations[]; total: number }> {
  const { page = 1, pageSize = 10, user_id, search, dateFrom, dateTo } = params;

  const db = await getDB();
  const offset = (page - 1) * pageSize;

  const conditions: string[] = [];
  const args: (string | number)[] = [];

  //
  // 🟢 filtros
  //
  if (user_id != null) {
    conditions.push("s.user_id = ?");
    args.push(user_id);
  }

  if (search?.trim()) {
    conditions.push("CAST(s.id AS TEXT) LIKE ?");
    args.push(`%${search.trim()}%`);
  }

  //
  // 🟢 fechas
  //
  if (dateFrom && dateTo) {
    conditions.push("s.sold_at BETWEEN ? AND ?");
    args.push(dateFrom, dateTo);
  } else if (dateFrom) {
    conditions.push("s.sold_at >= ?");
    args.push(dateFrom);
  } else if (dateTo) {
    conditions.push("s.sold_at <= ?");
    args.push(dateTo);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  //
  // 🟢 total
  //
  const countRows = await db.select<{ total: number }[]>(
    `SELECT COUNT(*) as total FROM sales s ${where}`,
    args,
  );

  const total = countRows[0]?.total ?? 0;

  //
  // 🟢 ventas paginadas
  //
  const sales = await db.select<Sale[]>(
    `SELECT s.*
     FROM sales s
     ${where}
     ORDER BY s.sold_at DESC
     LIMIT ? OFFSET ?`,
    [...args, pageSize, offset],
  );

  if (sales.length === 0) {
    return { data: [], total };
  }

  const saleIds = sales.map((s) => s.id);

  //
  // 🟢 traer items en batch
  //
  const items = await db.select<SaleItem[]>(
    `SELECT * FROM sale_items WHERE sale_id IN (${saleIds.map(() => "?").join(",")})`,
    saleIds,
  );

  //
  // 🟢 traer payments en batch
  //
  const payments = await db.select<Payment[]>(
    `SELECT * FROM payments WHERE sale_id IN (${saleIds.map(() => "?").join(",")})`,
    saleIds,
  );

  //
  // 🟢 agrupar en memoria (MUY rápido)
  //
  const itemsBySaleId = new Map<number, SaleItem[]>();
  const paymentsBySaleId = new Map<number | null, Payment[]>();

  for (const item of items) {
    if (!itemsBySaleId.has(item.sale_id)) {
      itemsBySaleId.set(item.sale_id, []);
    }
    itemsBySaleId.get(item.sale_id)!.push(item);
  }

  for (const payment of payments) {
    if (!paymentsBySaleId.has(payment.sale_id || null)) {
      paymentsBySaleId.set(payment.sale_id || null, []);
    }
    paymentsBySaleId.get(payment.sale_id || null)!.push(payment);
  }

  //
  // 🟢 armar respuesta final
  //
  const data: SaleWithRelations[] = sales.map((sale) => ({
    sale,
    items: itemsBySaleId.get(sale.id) ?? [],
    payments: paymentsBySaleId.get(sale.id) ?? [],
  }));

  return { data, total };
}
