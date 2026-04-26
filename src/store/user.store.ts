import { create } from "zustand";

// 🔹 ajusta al tipo real si ya lo tienes
export type User = {
  id: number;
  name: string;
};

type UserStore = {
  user: User | null;
  setUser: (user: User | null) => void;
  clearUser: () => void;
};

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));
