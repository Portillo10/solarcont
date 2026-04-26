import { getDB } from "../config/db";

export async function runMigrations() {
  const db = await getDB();

  await db.execute("PRAGMA defer_foreign_keys = ON;");
  await db.execute(`PRAGMA foreign_keys = ON;`);
  await db.execute("PRAGMA journal_mode = WAL;");
  await db.execute("PRAGMA busy_timeout = 5000;");

  // USERS
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // await db.execute(`
  //   ALTER TABLE products ADD COLUMN deleted INTEGER DEFAULT 0;
  // `);
  // PRODUCTS
  await db.execute(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      brand TEXT,
      category TEXT,
      price REAL DEFAULT 0,
      purchase_price REAL DEFAULT 0,
      features TEXT,
      deleted INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      user_id INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // CUSTOMERS
  await db.execute(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      document TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // SUPPLIERS
  await db.execute(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact TEXT,
      phone TEXT,
      address TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // SALES
  await db.execute(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      total REAL NOT NULL,
      status TEXT DEFAULT 'PENDING',
      sold_at TEXT DEFAULT CURRENT_TIMESTAMP,
      hidden INTEGER DEFAULT 0,
      user_id INTEGER,
      customer_id INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );
  `);

  // SALE ITEMS
  await db.execute(`
    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      purchase_price REAL NOT NULL,
      sale_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      FOREIGN KEY (sale_id) REFERENCES sales(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
  `);

  // PAYMENTS
  await db.execute(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      method TEXT,
      description TEXT,
      paid_at TEXT DEFAULT CURRENT_TIMESTAMP,
      type TEXT DEFAULT 'SALE',
      sale_id INTEGER,
      user_id INTEGER,
      FOREIGN KEY (sale_id) REFERENCES sales(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // PURCHASES
  await db.execute(`
    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      total REAL NOT NULL,
      purchased_at TEXT DEFAULT CURRENT_TIMESTAMP,
      user_id INTEGER,
      supplier_id INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    );
  `);

  // PURCHASE ITEMS
  await db.execute(`
    CREATE TABLE IF NOT EXISTS purchase_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      purchase_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      FOREIGN KEY (purchase_id) REFERENCES purchases(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
  `);

  // INVENTORY MOVEMENTS
  await db.execute(`
    CREATE TABLE IF NOT EXISTS inventory_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      reference_id INTEGER,
      reference_type TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      product_id INTEGER NOT NULL,
      user_id INTEGER,
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // EXPENSES
  await db.execute(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT,
      amount REAL NOT NULL,
      description TEXT NOT NULL,
      date TEXT DEFAULT CURRENT_TIMESTAMP,
      hidden INTEGER DEFAULT 0,
      user_id INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  await db.execute(`
    CREATE VIEW IF NOT EXISTS products_with_stock AS
      SELECT 
        p.id,
        p.name,
        p.brand,
        p.category,
        p.price,
        p.purchase_price,
        p.features,
        p.created_at,
        p.updated_at,
        p.user_id,
        COALESCE(SUM(im.quantity), 0) AS stock
      FROM products p
    LEFT JOIN inventory_movements im 
      ON im.product_id = p.id
      WHERE p.deleted = 0
      GROUP BY p.id;
  `);

  await db.execute(`
    CREATE VIEW IF NOT EXISTS sales_with_summary AS
      SELECT 
        s.id,
        s.total,
        s.status,
        s.sold_at,
        s.hidden,
        s.user_id,
        s.customer_id,

        COALESCE(SUM(p.amount), 0) AS total_paid,

        COUNT(p.id) AS payments_count

      FROM sales s
      LEFT JOIN payments p 
        ON p.sale_id = s.id

      GROUP BY s.id;
  `);

  // await db.execute(`DROP VIEW IF EXISTS transactions_view;`);

  await db.execute(`
    CREATE VIEW IF NOT EXISTS transactions_view AS

    SELECT
      id,
      description,
      amount,
      user_id,
      paid_at AS date,
      'payment' AS source
    FROM payments
    WHERE sale_id IS NULL

    UNION ALL

    SELECT
      id,
      description,
      -amount AS amount,
      user_id,
      date,
      'expense' AS source
    FROM expenses

    ORDER BY date DESC;
    `);

  await db.execute(`
  INSERT INTO users (name, username)
  SELECT name, username FROM (
    SELECT 'Marlon Portillo' AS name, 'marlon' AS username
    UNION ALL
    SELECT 'Mary Montoya', 'mary'
  )
  WHERE NOT EXISTS (SELECT 1 FROM users);
  `);

  // INDEXES
  await db.execute(
    `CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);`,
  );
  await db.execute(
    `CREATE INDEX IF NOT EXISTS idx_sales_user_id ON sales(user_id);`,
  );
  await db.execute(
    `CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);`,
  );

  await db.execute(
    `CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);`,
  );
  await db.execute(
    `CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);`,
  );

  await db.execute(
    `CREATE INDEX IF NOT EXISTS idx_payments_sale_id ON payments(sale_id);`,
  );
  await db.execute(
    `CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);`,
  );

  await db.execute(
    `CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);`,
  );
  await db.execute(
    `CREATE INDEX IF NOT EXISTS idx_purchases_supplier_id ON purchases(supplier_id);`,
  );

  await db.execute(
    `CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase_id ON purchase_items(purchase_id);`,
  );
  await db.execute(
    `CREATE INDEX IF NOT EXISTS idx_purchase_items_product_id ON purchase_items(product_id);`,
  );

  await db.execute(
    `CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_id ON inventory_movements(product_id);`,
  );
  await db.execute(
    `CREATE INDEX IF NOT EXISTS idx_inventory_movements_user_id ON inventory_movements(user_id);`,
  );

  await db.execute(
    `CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);`,
  );
}
