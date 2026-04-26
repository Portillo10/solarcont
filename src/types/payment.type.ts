export type PaymentType = "SALE" | "OTHER";

export type Payment = {
  id: number;
  amount: number;
  method?: string | null;
  description?: string | null;
  paid_at: string;
  type: PaymentType;
  sale_id?: number | null;
  user_id?: number | null;
};
