export type Expense = {
  id: number;
  category?: string | null;
  amount: number;
  description: string;
  date: string;
  hidden: number; // 0 o 1
  user_id?: number | null;
};
