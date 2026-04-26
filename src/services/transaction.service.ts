import { getDB } from "@/config/db";
import { formatDate } from "../lib/formatter";
import {
  CreateTransactionInput,
  Transaction,
  TransactionSource,
  UpdateTransactionInput,
} from "../types/transaction.type";

//
// 🟢 GET TRANSACTIONS
//
export async function getTransactions(
  user_id?: number | null,
  search?: string,
): Promise<Transaction[]> {
  const db = await getDB();

  const conditions: string[] = [];
  const params: any[] = [];

  if (user_id != null) {
    conditions.push("user_id = ?");
    params.push(user_id);
  }

  if (search?.trim()) {
    conditions.push(`description LIKE ?`);
    params.push(`%${search}%`);
  }

  const where =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  return await db.select<Transaction[]>(
    `
    SELECT *
    FROM transactions_view
    ${where}
    ORDER BY date DESC
    `,
    params,
  );
}

//
// 🟢 CREATE
//
export async function createTransaction(
  input: CreateTransactionInput,
): Promise<boolean> {
  const db = await getDB();

  const dateParam = formatDate(input.date);

  if (input.source === "payment") {
    await db.execute(
      `INSERT INTO payments
        (amount, description, paid_at, method, type, user_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        input.amount,
        input.description,
        dateParam,
        input.method ?? null,
        input.type ?? "OTHER",
        input.user_id ?? null,
      ],
    );
  } else {
    await db.execute(
      `INSERT INTO expenses
        (amount, description, date, user_id)
       VALUES (?, ?, ?, ?)`,
      [input.amount, input.description, dateParam, input.user_id ?? null],
    );
  }

  return true;
}

//
// 🟢 UPDATE
//
export async function updateTransaction(
  id: number,
  source: TransactionSource,
  input: UpdateTransactionInput,
): Promise<boolean> {
  const db = await getDB();

  const timeString = "T12:31:28.862Z";

  const dateParam = !input.date
    ? null
    : input.date.includes("T")
      ? input.date
      : `${input.date}${timeString}`;

  if (source === "payment") {
    await db.execute(
      `UPDATE payments SET
        amount = COALESCE(?, amount),
        description = COALESCE(?, description),
        paid_at = COALESCE(?, paid_at),
        method = COALESCE(?, method),
        type = COALESCE(?, type),
        user_id = COALESCE(?, user_id)
       WHERE id = ?`,
      [
        input.amount ?? null,
        input.description ?? null,
        dateParam ?? null,
        input.method ?? null,
        input.type ?? null,
        input.user_id ?? null,
        id,
      ],
    );
  } else {
    await db.execute(
      `UPDATE expenses SET
        amount = COALESCE(?, amount),
        description = COALESCE(?, description),
        date = COALESCE(?, date),
        user_id = COALESCE(?, user_id)
       WHERE id = ?`,
      [
        input.amount ?? null,
        input.description ?? null,
        dateParam ?? null,
        input.user_id ?? null,
        id,
      ],
    );
  }

  return true;
}

//
// 🟢 DELETE
//
export async function deleteTransaction(
  id: number,
  source: TransactionSource,
): Promise<boolean> {
  const db = await getDB();

  const table = source === "payment" ? "payments" : "expenses";

  const result = await db.execute(`DELETE FROM ${table} WHERE id = ?`, [id]);

  if (result.rowsAffected === 0) {
    throw new Error("Transaction not found");
  }

  return true;
}

//
// 🟢 OVERVIEW
//
export async function getTransactionsOverview(
  user_id?: number | null,
  dateFrom?: string,
  dateTo?: string,
): Promise<{
  balance: number;
  income: number;
  expenses: number;
  count: number;
}> {
  const db = await getDB();

  const conditions: string[] = [];
  const params: any[] = [];

  //
  // 🟢 filtro por usuario
  //
  if (user_id != null) {
    conditions.push("user_id = ?");
    params.push(user_id);
  }

  //
  // 🟢 rango de fechas
  //
  if (dateFrom && dateTo) {
    conditions.push("date BETWEEN ? AND ?");
    params.push(dateFrom, dateTo);
  } else if (dateFrom) {
    conditions.push("date >= ?");
    params.push(dateFrom);
  } else if (dateTo) {
    conditions.push("date <= ?");
    params.push(dateTo);
  } else {
    // 🔥 default: últimos 30 días
    conditions.push(`date >= datetime('now', '-30 days')`);
  }

  //
  // 🟢 construir WHERE
  //
  const where =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const rows = await db.select<
    {
      balance: number;
      income: number;
      expenses: number;
      count: number;
    }[]
  >(
    `
    SELECT
      COALESCE(SUM(amount), 0) as balance,

      COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as income,

      COALESCE(SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END), 0) as expenses,

      COUNT(*) as count

    FROM transactions_view
    ${where}
    `,
    params,
  );

  const r = rows[0];

  return {
    balance: r.balance ?? 0,
    income: r.income ?? 0,
    expenses: Math.abs(r.expenses ?? 0),
    count: r.count ?? 0,
  };
}

export type PaginatedTransactions = {
  data: Transaction[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type GetPaginatedParams = {
  page: number;
  pageSize: number;
  user_id?: number | null;
  search?: string;

  dateFrom?: string;
  dateTo?: string;
};

export async function getPaginatedTransactions({
  page = 1,
  pageSize = 10,
  user_id,
  search,
  dateFrom,
  dateTo,
}: GetPaginatedParams): Promise<PaginatedTransactions> {
  const db = await getDB();

  const conditions: string[] = [];
  const params: any[] = [];

  //
  // 🟢 filtros
  //
  if (user_id != null) {
    conditions.push("user_id = ?");
    params.push(user_id);
  }

  if (search?.trim()) {
    conditions.push("description LIKE ?");
    params.push(`%${search}%`);
  }

  //
  // 🟢 filtros por fecha
  //
  if (dateFrom && dateTo) {
    conditions.push("date BETWEEN ? AND ?");
    params.push(dateFrom, dateTo);
  } else if (dateFrom) {
    conditions.push("date >= ?");
    params.push(dateFrom);
  } else if (dateTo) {
    conditions.push("date <= ?");
    params.push(dateTo);
  }
  // 🔥 opcional: default últimos 30 días
  // else {
  //   conditions.push("date >= datetime('now', '-30 days')");
  // }

  const where =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  //
  // 🟢 total count
  //
  const countRows = await db.select<{ total: number }[]>(
    `
    SELECT COUNT(*) as total
    FROM transactions_view
    ${where}
    `,
    params,
  );

  const total = countRows[0]?.total ?? 0;

  //
  // 🟢 paginación
  //
  const offset = (page - 1) * pageSize;

  const data = await db.select<Transaction[]>(
    `
    SELECT *
    FROM transactions_view
    ${where}
    ORDER BY date DESC
    LIMIT ? OFFSET ?
    `,
    [...params, pageSize, offset],
  );

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
