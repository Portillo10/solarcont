import { useState } from "react";
import { User } from "../types/user.type";
import { useUser } from "./useUser";

export const useUserSelect = () => {
  const { setUser, user } = useUser();

  const [selectedUserId, setSelectedUserId] = useState<number | null>(
    user?.id || null,
  );
  const handleUserChange = (newUser: User | null) => {
    setUser(newUser);
    setSelectedUserId(newUser?.id || null);
  };
  return { selectedUserId, handleUserChange };
};
