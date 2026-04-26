import { Payment } from "./payment.type";
import { SaleItem } from "./sale_item.type";

export type SaleStatus = "PENDING" | "PAID" | "CANCELLED";

export type Sale = {
  id: number;
  total: number;
  status: SaleStatus;
  sold_at: string;
  hidden: number; // SQLite usa INTEGER (0/1)
  user_id?: number | null;
  customer_id?: number | null;
};

export type SaleWithRelations = {
  sale: Sale;
  items: SaleItem[];
  payments: Payment[];
};

export type SaleWithSummary = Sale & {
  total_paid: number;
  payment_count: number;
};
