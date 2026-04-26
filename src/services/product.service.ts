import { getDB } from "@/config/db";
import { Product } from "../types/product.type";
import { getProductsStock } from "./inventory.service";

//
// 🟢 TYPES (DTOs)
//
export type CreateProductInput = {
  name: string;
  brand?: string;
  category?: string;
  price: number;
  purchase_price: number;
  user_id: number;
  deleted?: number;
};

export type UpdateProductInput = Partial<CreateProductInput>;

//
// 🟢 CREATE
//
export async function createProduct(input: CreateProductInput) {
  if (!input.name?.trim()) {
    throw new Error("Name is required");
  }

  const db = await getDB();

  const result = await db.execute(
    `INSERT INTO products 
      (name, brand, category, price, purchase_price, user_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      input.name,
      input.brand ?? null,
      input.category ?? null,
      input.price ?? 0,
      input.purchase_price ?? 0,
      input.user_id ?? null,
    ],
  );

  return {
    id: result.lastInsertId,
    ...input,
  } as Product;
}

//
// 🟢 GET ALL
//
export async function getProducts(): Promise<Product[]> {
  const db = await getDB();

  const rows = await db.select<Product[]>(
    `SELECT * FROM products ORDER BY id DESC`,
  );

  return rows;
}

//
// 🟢 GET BY ID
//
export async function getProductById(id: number): Promise<Product> {
  const db = await getDB();

  const row = await db.select<Product[]>(
    `SELECT * FROM products WHERE id = ?`,
    [id],
  );

  if (!row.length) {
    throw new Error("Product not found");
  }

  return row[0];
}

//
// 🟢 UPDATE
//
export async function updateProduct(
  id: number,
  input: UpdateProductInput,
): Promise<Product> {
  const db = await getDB();

  // comprobar existencia
  const existing = await db.select<Product[]>(
    `SELECT * FROM products WHERE id = ?`,
    [id],
  );

  if (!existing.length) {
    throw new Error("Product not found");
  }

  await db.execute(
    `UPDATE products SET
      name = COALESCE(?, name),
      brand = COALESCE(?, brand),
      category = COALESCE(?, category),
      price = COALESCE(?, price),
      purchase_price = COALESCE(?, purchase_price),
      updated_at = CURRENT_TIMESTAMP,
      user_id = COALESCE(?, user_id),
      deleted = COALESCE(?, deleted)
     WHERE id = ?`,
    [
      input.name ?? null,
      input.brand ?? null,
      input.category ?? null,
      input.price ?? null,
      input.purchase_price ?? null,
      input.user_id ?? null,
      input.deleted ?? null,
      id,
    ],
  );

  return await getProductById(id);
}

//
// 🟢 DELETE (hard delete)
//
export async function deleteProduct(id: number) {
  const db = await getDB();

  const result = await db.execute(
    `UPDATE products 
     SET deleted = 1, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [id],
  );

  if (result.rowsAffected === 0) {
    throw new Error("Product not found");
  }

  return true;
}

//
// 🟢 SEARCH
//
export async function searchProducts(query: string): Promise<Product[]> {
  const db = await getDB();

  const pattern = `%${query}%`;

  const rows = await db.select<Product[]>(
    `SELECT * FROM products
     WHERE name LIKE ?
        OR brand LIKE ?
        OR category LIKE ?
     ORDER BY id DESC`,
    [pattern, pattern, pattern],
  );

  return rows;
}

export async function getProductsWithStock() {
  const products = await getProducts();

  const stockMap = await getProductsStock(products.map((p) => p.id));

  return products.map((p) => ({
    ...p,
    stock: stockMap[p.id] ?? 0,
  }));
}

type GetPaginatedProductsParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  user_id?: number | null;
};

type ProductWithStock = Product & {
  stock: number;
};

type PaginatedProducts = {
  data: ProductWithStock[];
  total: number;
  page: number;
  pageSize: number;
};

export async function getPaginatedProducts(
  params: GetPaginatedProductsParams = {},
): Promise<PaginatedProducts> {
  const db = await getDB();

  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  const offset = (page - 1) * pageSize;

  const search = params.search?.trim();
  const hasSearch = !!search;
  const hasUser = params.user_id != null;

  const pattern = `%${search}%`;

  // Build WHERE conditions incrementally
  const conditions: string[] = [];
  const whereParams: (string | number)[] = [];

  if (hasSearch) {
    conditions.push("(name LIKE ? OR brand LIKE ? OR category LIKE ?)");
    whereParams.push(pattern, pattern, pattern);
  }

  if (hasUser) {
    conditions.push("user_id = ?");
    whereParams.push(params.user_id!);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const totalRows = await db.select<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM products_with_stock ${whereClause}`,
    whereParams,
  );

  const total = totalRows[0]?.count ?? 0;

  const data = await db.select<ProductWithStock[]>(
    `SELECT *
     FROM products_with_stock
     ${whereClause}
     ORDER BY id DESC
     LIMIT ? OFFSET ?`,
    [...whereParams, pageSize, offset],
  );

  return {
    data,
    total,
    page,
    pageSize,
  };
}

export type ProductsOverview = {
  totalProducts: number;
  lowStockCount: number;
  totalStock: number;
  totalCapital: number;
};

export async function getProductsOverview(
  user_id?: number | null,
  searchTerm?: string,
): Promise<ProductsOverview> {
  const db = await getDB();

  const conditions: string[] = [];
  const params: any[] = [];

  //
  // 🟢 Filtro por usuario
  //
  if (user_id != null) {
    conditions.push("user_id = ?");
    params.push(user_id);
  }

  //
  // 🟢 Filtro por búsqueda
  //
  if (searchTerm?.trim()) {
    conditions.push(`
      (
        name LIKE ?
        OR brand LIKE ?
        OR category LIKE ?
      )
    `);

    const pattern = `%${searchTerm}%`;

    params.push(pattern, pattern, pattern);
  }

  //
  // 🟢 Construir WHERE dinámico
  //
  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const rows = await db.select<
    {
      total_products: number;
      low_stock_count: number;
      total_stock: number;
      total_capital: number;
    }[]
  >(
    `
    SELECT
      COUNT(*) as total_products,

      SUM(CASE WHEN stock <= 5 THEN 1 ELSE 0 END) as low_stock_count,

      COALESCE(SUM(stock), 0) as total_stock,

      COALESCE(SUM(stock * purchase_price), 0) as total_capital

    FROM products_with_stock
    ${whereClause}
    `,
    params,
  );

  const result = rows[0];

  return {
    totalProducts: result.total_products ?? 0,
    lowStockCount: result.low_stock_count ?? 0,
    totalStock: result.total_stock ?? 0,
    totalCapital: result.total_capital ?? 0,
  };
}
