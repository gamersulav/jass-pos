import { createClient } from '@libsql/client';

let db;

export async function getDb() {
  if (db) return db;
  const client = createClient({
    url: process.env.TURSO_DB_URL,
    authToken: process.env.TURSO_DB_TOKEN,
  });

  db = {
    async query(sql, args = []) {
      const r = await client.execute({ sql, args });
      return r.rows.map(row => Object.fromEntries(Object.entries(row)));
    },
    async queryOne(sql, args = []) {
      const r = await client.execute({ sql, args });
      return r.rows[0] ? Object.fromEntries(Object.entries(r.rows[0])) : null;
    },
    async run(sql, args = []) {
      const r = await client.execute({ sql, args });
      return { lastId: Number(r.lastInsertRowid), changes: r.rowsAffected };
    },
    async tx(fn) {
      const t = await client.transaction('write');
      try {
        const txObj = {
          async query(sql, args = []) {
            const r = await t.execute({ sql, args });
            return r.rows.map(row => Object.fromEntries(Object.entries(row)));
          },
          async queryOne(sql, args = []) {
            const r = await t.execute({ sql, args });
            return r.rows[0] ? Object.fromEntries(Object.entries(r.rows[0])) : null;
          },
          async run(sql, args = []) {
            const r = await t.execute({ sql, args });
            return { lastId: Number(r.lastInsertRowid), changes: r.rowsAffected };
          },
        };
        const result = await fn(txObj);
        await t.commit();
        return result;
      } catch (e) {
        await t.rollback();
        throw e;
      }
    },
  };

  await initDb(client);
  return db;
}

async function initDb(client) {
  const schema = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'staff',
      created_at DATETIME DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS shoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      brand TEXT DEFAULT '',
      category TEXT DEFAULT 'General',
      cost_price REAL DEFAULT 0,
      selling_price REAL DEFAULT 0,
      notes TEXT DEFAULT '',
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT (datetime('now')),
      created_by INTEGER REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS shoe_sizes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shoe_id INTEGER NOT NULL REFERENCES shoes(id) ON DELETE CASCADE,
      size INTEGER NOT NULL,
      quantity INTEGER DEFAULT 0,
      UNIQUE(shoe_id, size)
    );

    CREATE TABLE IF NOT EXISTS accessories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT DEFAULT 'General',
      cost_price REAL DEFAULT 0,
      selling_price REAL DEFAULT 0,
      stock INTEGER DEFAULT 0,
      notes TEXT DEFAULT '',
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT (datetime('now')),
      created_by INTEGER REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payment_method TEXT NOT NULL,
      total_amount REAL DEFAULT 0,
      discount_amount REAL DEFAULT 0,
      credit_customer TEXT DEFAULT '',
      user_id INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
      item_type TEXT NOT NULL DEFAULT 'shoe',
      shoe_id INTEGER REFERENCES shoes(id),
      shoe_size INTEGER,
      accessory_id INTEGER REFERENCES accessories(id),
      item_name TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      unit_price REAL DEFAULT 0,
      cost_price REAL DEFAULT 0,
      item_discount REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS stock_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_type TEXT NOT NULL DEFAULT 'shoe',
      shoe_id INTEGER REFERENCES shoes(id),
      accessory_id INTEGER REFERENCES accessories(id),
      item_name TEXT NOT NULL,
      size INTEGER,
      quantity INTEGER DEFAULT 0,
      unit_cost REAL DEFAULT 0,
      direction TEXT DEFAULT 'in',
      notes TEXT DEFAULT '',
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sales_returns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER REFERENCES sales(id),
      item_name TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      return_amount REAL DEFAULT 0,
      return_profit REAL DEFAULT 0,
      reason TEXT DEFAULT '',
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      amount REAL DEFAULT 0,
      payment_method TEXT DEFAULT 'Cash',
      expense_date TEXT NOT NULL,
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cash_opening (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      amount REAL DEFAULT 0,
      adjustment REAL DEFAULT 0,
      UNIQUE(date, payment_method)
    );

    CREATE TABLE IF NOT EXISTS shop_tabs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shop_name TEXT NOT NULL,
      direction TEXT DEFAULT 'in',
      quantity REAL DEFAULT 1,
      unit_cost REAL DEFAULT 0,
      notes TEXT DEFAULT '',
      settled INTEGER DEFAULT 0,
      settled_at DATETIME,
      created_at DATETIME DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS edit_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      entity_id INTEGER NOT NULL,
      entity_name TEXT NOT NULL,
      field_name TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      changed_by INTEGER REFERENCES users(id),
      changed_by_name TEXT,
      changed_at DATETIME DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS credits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL,
      amount REAL DEFAULT 0,
      description TEXT DEFAULT '',
      status TEXT DEFAULT 'pending',
      sale_id INTEGER REFERENCES sales(id),
      settled_at DATETIME,
      created_at DATETIME DEFAULT (datetime('now'))
    );
  `;

  for (const stmt of schema.split(';').map(s => s.trim()).filter(Boolean)) {
    await client.execute(stmt);
  }
}
