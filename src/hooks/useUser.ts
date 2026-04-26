import { useUserStore } from "../store/user.store";

export function useUser() {
  const user = useUserStore((s) => s.user);
  const setUser = useUserStore((s) => s.setUser);
  const clearUser = useUserStore((s) => s.clearUser);

  return {
    user,
    setUser,
    clearUser,
    isAuthenticated: !!user, // opcional pero útil
  };
}
