export type Product = {
  id: number;
  name: string;
  brand?: string | null;
  category?: string | null;
  price: number;
  purchase_price: number;
  features?: string | null;
  created_at?: string;
  updated_at?: string;
  user_id?: number | null;
  deleted: number;
};

export type ProductWithStock = Product & {
  stock: number;
};
