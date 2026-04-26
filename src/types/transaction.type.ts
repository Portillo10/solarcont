export type TransactionSource = "payment" | "expense";

export type Transaction = {
  id: number;
  description: string;
  amount: number;
  user_id?: number | null;
  date: string;
  source: TransactionSource;
};

export type CreateTransactionInput = {
  description: string;
  amount: number;
  date: string;
  user_id?: number | null;
  source: TransactionSource;

  // opcionales para payments
  method?: string;
  type?: "SALE" | "OTHER";
};

export type UpdateTransactionInput = Partial<CreateTransactionInput>;

export type TransactionsOverview = {
  balance: number;
  income: number;
  expenses: number;
  count: number;
};
