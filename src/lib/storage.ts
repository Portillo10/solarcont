const USER_KEY = "current_user_id";

//
// 🟢 SET
//
export function setCurrentUserId(userId: number | null) {
  localStorage.setItem(USER_KEY, String(userId));
}

//
// 🟢 GET
//
export function getCurrentUserId(): number | null {
  const value = localStorage.getItem(USER_KEY);
  return value && !isNaN(Number(value)) ? Number(value) : null;
}

//
// 🟢 CLEAR (opcional)
//
export function clearCurrentUser() {
  localStorage.removeItem(USER_KEY);
}
