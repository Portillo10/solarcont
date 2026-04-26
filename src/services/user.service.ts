import { getDB } from "@/config/db";

//
// 🟢 TYPES
//
export type User = {
  id: number;
  name: string;
  username: string;
  password?: string | null;
  created_at: string;
};

export type CreateUserInput = {
  name: string;
  username: string;
  password?: string;
};

export type UpdateUserInput = Partial<CreateUserInput>;

//
// 🟢 CREATE
//
export async function createUser(input: CreateUserInput): Promise<User> {
  if (!input.name?.trim()) {
    throw new Error("Name is required");
  }

  if (!input.username?.trim()) {
    throw new Error("Username is required");
  }

  const db = await getDB();

  try {
    const result = await db.execute(
      `INSERT INTO users (name, username, password)
       VALUES (?, ?, ?)`,
      [input.name, input.username, input.password ?? null],
    );

    const user = await db.select<User[]>(`SELECT * FROM users WHERE id = ?`, [
      result.lastInsertId,
    ]);

    return user[0];
  } catch (err: any) {
    if (err.message?.includes("UNIQUE")) {
      throw new Error("Username already exists");
    }
    throw err;
  }
}

//
// 🟢 GET ALL
//
export async function getUsers(): Promise<User[]> {
  const db = await getDB();

  return await db.select<User[]>(`SELECT * FROM users ORDER BY id DESC`);
}

//
// 🟢 GET BY ID
//
export async function getUserById(id: number): Promise<User> {
  const db = await getDB();

  const rows = await db.select<User[]>(`SELECT * FROM users WHERE id = ?`, [
    id,
  ]);

  if (!rows.length) {
    throw new Error("User not found");
  }

  return rows[0];
}

//
// 🟢 UPDATE
//
export async function updateUser(
  id: number,
  input: UpdateUserInput,
): Promise<User> {
  const db = await getDB();

  const existing = await db.select<User[]>(`SELECT * FROM users WHERE id = ?`, [
    id,
  ]);

  if (!existing.length) {
    throw new Error("User not found");
  }

  try {
    await db.execute(
      `UPDATE users SET
        name = COALESCE(?, name),
        username = COALESCE(?, username),
        password = COALESCE(?, password)
       WHERE id = ?`,
      [input.name ?? null, input.username ?? null, input.password ?? null, id],
    );
  } catch (err: any) {
    if (err.message?.includes("UNIQUE")) {
      throw new Error("Username already exists");
    }
    throw err;
  }

  return await getUserById(id);
}

//
// 🟢 DELETE
//
export async function deleteUser(id: number) {
  const db = await getDB();

  const result = await db.execute(`DELETE FROM users WHERE id = ?`, [id]);

  if (result.rowsAffected === 0) {
    throw new Error("User not found");
  }

  return true;
}
