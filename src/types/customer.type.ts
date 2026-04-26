export type Customer = {
  id: number;
  name: string;
  document?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  created_at: string;
};
