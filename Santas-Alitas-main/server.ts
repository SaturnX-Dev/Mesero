import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import Database from "better-sqlite3";
import { Product, Category } from "./src/types";
import { MENU_DATA } from "./src/data";

const dbPath = process.env.DB_PATH || "restaurant.db";
// Ensure directory exists if DB_PATH is in a subfolder
const dbDir = path.dirname(dbPath);
if (dbDir !== "." && !fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// Enable WAL mode for better concurrent read/write performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    category TEXT NOT NULL,
    modifiers TEXT
  );

  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS modifiers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    options_json TEXT, -- array of options
    max_selections INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS promotions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    conditions_json TEXT,
    discount_json TEXT,
    is_active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS tables (
    id TEXT PRIMARY KEY,
    x REAL,
    y REAL,
    alias TEXT
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    table_id TEXT NOT NULL,
    status TEXT DEFAULT 'OPEN', -- 'OPEN' or 'CLOSED'
    total REAL DEFAULT 0,
    tip REAL DEFAULT 0,
    tip_percent REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    closed_at DATETIME
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    quantity INTEGER NOT NULL,
    modifiers TEXT,
    notes TEXT,
    FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_orders_table_status ON orders(table_id, status);
  CREATE INDEX IF NOT EXISTS idx_orders_closed_at ON orders(closed_at);
  CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    pin TEXT NOT NULL,
    role TEXT DEFAULT 'waiter', -- 'admin' or 'waiter'
    theme TEXT DEFAULT 'light',
    accent_color TEXT DEFAULT '#ea580c'
  );

  CREATE TABLE IF NOT EXISTS table_requests (
    id TEXT PRIMARY KEY,
    table_id TEXT NOT NULL,
    from_user_name TEXT NOT NULL,
    items_json TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Graceful schema upgrades
try { db.exec("ALTER TABLE orders ADD COLUMN waiter_name TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE order_items ADD COLUMN status TEXT DEFAULT 'pending';"); } catch (e) {}
try { db.exec("ALTER TABLE users ADD COLUMN theme TEXT DEFAULT 'light';"); } catch (e) {}
try { db.exec("ALTER TABLE users ADD COLUMN accent_color TEXT DEFAULT '#ea580c';"); } catch (e) {}

// Seed Users as requested
const seedUsers = [
  { id: 'admin', name: 'root', pin: 'admin', role: 'admin' },
  { id: 'waiter1', name: 'Mesero 1', pin: 'Alitas', role: 'waiter' },
  { id: 'waiter2', name: 'Mesero 2', pin: 'Alitas', role: 'waiter' },
  { id: 'waiter3', name: 'Mesero 3', pin: 'Alitas', role: 'waiter' }
];

const checkUser = db.prepare("SELECT * FROM users WHERE id = ?");
const insertUser = db.prepare("INSERT INTO users (id, name, pin, role) VALUES (?, ?, ?, ?)");

for (const u of seedUsers) {
  if (!checkUser.get(u.id)) {
    insertUser.run(u.id, u.name, u.pin, u.role);
  }
}

// Auto-purge: delete closed orders older than 7 days
const purgeOld = db.prepare(`
  DELETE FROM orders WHERE status = 'CLOSED' AND closed_at < datetime('now', '-7 days')
`);
const purged = purgeOld.run();
if (purged.changes > 0) {
  console.log(`Purged ${purged.changes} orders older than 7 days`);
}

// Seed data
const insertProduct = db.prepare(`
  INSERT INTO products (id, name, description, price, category, modifiers)
  VALUES (?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    name=excluded.name,
    description=excluded.description,
    price=excluded.price,
    category=excluded.category,
    modifiers=excluded.modifiers
`);

for (const p of MENU_DATA) {
  insertProduct.run(p.id, p.name, p.description, p.price, p.category, p.modifiers ? JSON.stringify(p.modifiers) : null);
}

// Seed categories if empty
const catCount = db.prepare("SELECT count(*) as count FROM categories").get() as { count: number };
if (catCount.count === 0) {
  const distinctCategories = db.prepare("SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category != ''").all();
  const insertCat = db.prepare("INSERT INTO categories (id, name, sort_order) VALUES (?, ?, ?)");
  distinctCategories.forEach((c: any, index: number) => {
    insertCat.run(Math.random().toString(36).substr(2, 9), c.category, index);
  });
}

const tableCount = db.prepare("SELECT count(*) as count FROM tables").get() as { count: number };
if (tableCount.count === 0) {
  const insertTable = db.prepare("INSERT INTO tables (id, x, y) VALUES (?, ?, ?)");
  const defaultTables = [
    { id: '10', x: 80, y: 10 }, { id: '20', x: 60, y: 10 }, { id: '30', x: 40, y: 10 },
    { id: '11', x: 80, y: 25 }, { id: '21', x: 60, y: 25 }, { id: '31', x: 40, y: 25 },
    { id: '12', x: 80, y: 40 }, { id: '22', x: 60, y: 40 }, { id: '32', x: 40, y: 40 },
    { id: '13', x: 80, y: 55 }, { id: '23', x: 60, y: 55 }, { id: '33', x: 40, y: 55 },
    { id: '14', x: 80, y: 70 }, { id: '24', x: 60, y: 70 }, { id: '34', x: 40, y: 70 },
    { id: '15', x: 80, y: 85 }, { id: '25', x: 60, y: 85 }, { id: '35', x: 40, y: 85 },
    { id: '40', x: 30, y: 30 }, { id: '41', x: 30, y: 45 },
    { id: '42', x: 20, y: 55 }, { id: '43', x: 20, y: 70 },
    { id: '44', x: 30, y: 85 }, { id: '45', x: 20, y: 85 },
  ];
  for (const t of defaultTables) {
    insertTable.run(t.id, t.x, t.y);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Settings Routes
  app.get("/api/settings", (req, res) => {
    const userId = req.query.userId;
    if (userId) {
      const user = db.prepare("SELECT theme, accent_color as accentColor FROM users WHERE id = ?").get(userId) as any;
      res.json(user || { theme: 'light', accentColor: '#ea580c' });
    } else {
      const rows = db.prepare("SELECT key, value FROM settings").all() as { key: string, value: string }[];
      const settings: Record<string, string> = {};
      rows.forEach(r => { settings[r.key] = r.value; });
      res.json(settings);
    }
  });

  app.post("/api/settings", (req, res) => {
    const { key, value, userId } = req.body;
    if (userId) {
      if (key === 'theme') {
        db.prepare("UPDATE users SET theme = ? WHERE id = ?").run(value, userId);
      } else if (key === 'accentColor') {
        db.prepare("UPDATE users SET accent_color = ? WHERE id = ?").run(value, userId);
      }
      res.json({ success: true });
    } else {
      db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value")
        .run(key, value);
      res.json({ success: true });
    }
  });

  // API Routes
  app.get("/api/products", (req, res) => {
    const products = db.prepare("SELECT * FROM products").all();
    res.json(products.map((p: any) => ({
      ...p,
      modifiers: p.modifiers ? JSON.parse(p.modifiers) : null
    })));
  });

  app.post("/api/products", (req, res) => {
    const { id, name, description, price, category, modifiers } = req.body;
    const insert = db.prepare(`
      INSERT INTO products (id, name, description, price, category, modifiers)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name=excluded.name,
        description=excluded.description,
        price=excluded.price,
        category=excluded.category,
        modifiers=excluded.modifiers
    `);
    insert.run(id || Math.random().toString(36).substr(2, 9), name, description, price, category, modifiers ? JSON.stringify(modifiers) : null);
    res.json({ success: true });
  });

  // --- Categories CRUD ---
  app.get("/api/categories", (req, res) => {
    res.json(db.prepare("SELECT * FROM categories ORDER BY sort_order").all());
  });

  app.post("/api/categories", (req, res) => {
    const { id, name, sort_order } = req.body;
    const insert = db.prepare("INSERT INTO categories (id, name, sort_order) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, sort_order=excluded.sort_order");
    insert.run(id || Math.random().toString(36).substr(2, 9), name, sort_order || 0);
    res.json({ success: true });
  });

  app.delete("/api/categories/:id", (req, res) => {
    db.prepare("DELETE FROM categories WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // --- Modifiers CRUD ---
  app.get("/api/modifiers", (req, res) => {
    res.json(db.prepare("SELECT * FROM modifiers").all());
  });

  app.post("/api/modifiers", (req, res) => {
    const { id, name, type, options_json, max_selections } = req.body;
    const insert = db.prepare("INSERT INTO modifiers (id, name, type, options_json, max_selections) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, type=excluded.type, options_json=excluded.options_json, max_selections=excluded.max_selections");
    insert.run(id || Math.random().toString(36).substr(2, 9), name, type, options_json ? JSON.stringify(options_json) : null, max_selections || 1);
    res.json({ success: true });
  });

  app.delete("/api/modifiers/:id", (req, res) => {
    db.prepare("DELETE FROM modifiers WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // --- Promotions CRUD ---
  app.get("/api/promotions", (req, res) => {
    res.json(db.prepare("SELECT * FROM promotions").all());
  });

  app.post("/api/promotions", (req, res) => {
    const { id, name, description, conditions_json, discount_json, is_active } = req.body;
    const insert = db.prepare("INSERT INTO promotions (id, name, description, conditions_json, discount_json, is_active) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, description=excluded.description, conditions_json=excluded.conditions_json, discount_json=excluded.discount_json, is_active=excluded.is_active");
    insert.run(id || Math.random().toString(36).substr(2, 9), name, description, conditions_json ? JSON.stringify(conditions_json) : null, discount_json ? JSON.stringify(discount_json) : null, is_active === false ? 0 : 1);
    res.json({ success: true });
  });

  app.delete("/api/promotions/:id", (req, res) => {
    db.prepare("DELETE FROM promotions WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Export/Import Menu Routes
  app.get("/api/menu/export", (req, res) => {
    const backup = {
      products: db.prepare("SELECT * FROM products").all(),
      categories: db.prepare("SELECT * FROM categories").all(),
      modifiers: db.prepare("SELECT * FROM modifiers").all(),
      promotions: db.prepare("SELECT * FROM promotions").all()
    };
    res.json(backup);
  });

  app.post("/api/menu/import", (req, res) => {
    const { products, categories, modifiers, promotions } = req.body;
    try {
      db.transaction(() => {
        // We could clear tables first, or just insert/replace
        if (categories) {
          db.prepare("DELETE FROM categories").run();
          const insertCat = db.prepare("INSERT INTO categories (id, name, sort_order) VALUES (?, ?, ?)");
          for (const c of categories) insertCat.run(c.id, c.name, c.sort_order);
        }
        if (modifiers) {
          db.prepare("DELETE FROM modifiers").run();
          const insertMod = db.prepare("INSERT INTO modifiers (id, name, type, options_json, max_selections) VALUES (?, ?, ?, ?, ?)");
          for (const m of modifiers) insertMod.run(m.id, m.name, m.type, m.options_json, m.max_selections);
        }
        if (promotions) {
          db.prepare("DELETE FROM promotions").run();
          const insertPromo = db.prepare("INSERT INTO promotions (id, name, description, conditions_json, discount_json, is_active) VALUES (?, ?, ?, ?, ?, ?)");
          for (const p of promotions) insertPromo.run(p.id, p.name, p.description, p.conditions_json, p.discount_json, p.is_active);
        }
        if (products) {
          db.prepare("DELETE FROM products").run();
          const insertProd = db.prepare("INSERT INTO products (id, name, description, price, category, modifiers) VALUES (?, ?, ?, ?, ?, ?)");
          for (const p of products) insertProd.run(p.id, p.name, p.description, p.price, p.category, p.modifiers);
        }
      })();
      res.json({ success: true });
    } catch(err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get("/api/tables", (req, res) => {
    const tables = db.prepare("SELECT * FROM tables").all();
    // Get active order status and waiter name for each table
    const tablesWithStatus = tables.map((t: any) => {
      const activeOrder = db.prepare("SELECT id, waiter_name FROM orders WHERE table_id = ? AND status = 'OPEN'").get(t.id) as any;
      const pendingReq = db.prepare("SELECT count(id) as count FROM table_requests WHERE table_id = ? AND status = 'pending'").get(t.id) as any;
      
      return { 
        ...t, 
        isOccupied: !!activeOrder, 
        waiterName: activeOrder?.waiter_name || null,
        pendingRequests: pendingReq?.count || 0
      };
    });
    res.json(tablesWithStatus);
  });

  app.post("/api/tables", (req, res) => {
    const { id, x, y } = req.body;
    const insert = db.prepare("INSERT INTO tables (id, x, y) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET x=excluded.x, y=excluded.y");
    insert.run(id, x, y);
    res.json({ success: true });
  });

  app.delete("/api/tables/:id", (req, res) => {
    db.prepare("DELETE FROM tables WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // --- Users & Auth Routes ---
  app.get("/api/users", (req, res) => {
    const users = db.prepare("SELECT id, name, role FROM users").all();
    res.json(users);
  });

  app.post("/api/users/login", (req, res) => {
    const { name, pin } = req.body;
    const user = db.prepare("SELECT id, name, role, theme, accent_color as accentColor FROM users WHERE name = ? AND pin = ?").get(name, pin);
    if (user) {
      res.json({ success: true, user });
    } else {
      res.status(401).json({ success: false, error: "Invalid PIN" });
    }
  });

  app.post("/api/users", (req, res) => {
    const { id, name, pin, role } = req.body;
    const insert = db.prepare("INSERT INTO users (id, name, pin, role) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, pin=excluded.pin, role=excluded.role");
    insert.run(id, name, pin, role || 'waiter');
    res.json({ success: true });
  });

  // --- Table Requests Routes (Waiter Conflicts) ---
  app.get("/api/table-requests/:tableId", (req, res) => {
    const requests = db.prepare("SELECT * FROM table_requests WHERE table_id = ? AND status = 'pending'").all(req.params.tableId);
    res.json(requests.map((r: any) => ({ ...r, items: JSON.parse(r.items_json) })));
  });

  app.post("/api/table-requests", (req, res) => {
    const { tableId, fromUserName, items } = req.body;
    const id = Math.random().toString(36).substr(2, 9);
    db.prepare("INSERT INTO table_requests (id, table_id, from_user_name, items_json) VALUES (?, ?, ?, ?)")
      .run(id, tableId, fromUserName, JSON.stringify(items));
    res.json({ success: true });
  });

  app.post("/api/table-requests/:id/resolve", (req, res) => {
    const { action } = req.body; // 'approve' or 'reject'
    db.prepare("UPDATE table_requests SET status = ? WHERE id = ?").run(action === 'approve' ? 'approved' : 'rejected', req.params.id);
    res.json({ success: true });
  });

  // Order Routes
  app.get("/api/orders/active/:tableId", (req, res) => {
    const order = db.prepare("SELECT * FROM orders WHERE table_id = ? AND status = 'OPEN'").get(req.params.tableId) as any;
    if (!order) return res.json(null);
    
    const items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(order.id);
    res.json({
      ...order,
      items: items.map((i: any) => ({
        ...i,
        modifiers: i.modifiers ? JSON.parse(i.modifiers) : []
      }))
    });
  });

  app.post("/api/orders/add-item", (req, res) => {
    const { tableId, item, waiterName } = req.body;
    
    let order = db.prepare("SELECT id, waiter_name FROM orders WHERE table_id = ? AND status = 'OPEN'").get(tableId) as any;
    
    if (order && order.waiter_name !== waiterName) {
      // Table is owned by another waiter, send request instead
      const requestId = Math.random().toString(36).substr(2, 9);
      db.prepare("INSERT INTO table_requests (id, table_id, from_user_name, items_json) VALUES (?, ?, ?, ?)")
        .run(requestId, tableId, waiterName, JSON.stringify([item]));
      return res.json({ success: true, isRequest: true, ownerName: order.waiter_name });
    }

    if (!order) {
      const orderId = Math.random().toString(36).substr(2, 9);
      db.prepare("INSERT INTO orders (id, table_id, waiter_name) VALUES (?, ?, ?)").run(orderId, tableId, waiterName || 'Mesero');
      order = { id: orderId, waiter_name: waiterName || 'Mesero' };
    }

    const insertItem = db.prepare(`
      INSERT INTO order_items (id, order_id, product_id, name, price, quantity, modifiers, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertItem.run(
      item.orderItemId, 
      order.id, 
      item.productId, 
      item.name, 
      item.price, 
      item.quantity, 
      JSON.stringify(item.modifiers), 
      item.notes
    );

    res.json({ success: true, order });
  });

  app.post("/api/orders/close", (req, res) => {
    const { orderId, total, tip, tipPercent } = req.body;
    db.prepare(`
      UPDATE orders 
      SET status = 'CLOSED', total = ?, tip = ?, tip_percent = ?, closed_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(total, tip, tipPercent, orderId);
    res.json({ success: true });
  });

  app.post("/api/orders/update-item", (req, res) => {
    const { orderId, orderItemId, quantity } = req.body;
    if (quantity <= 0) {
      db.prepare("DELETE FROM order_items WHERE order_id = ? AND id = ?").run(orderId, orderItemId);
    } else {
      db.prepare("UPDATE order_items SET quantity = ? WHERE order_id = ? AND id = ?").run(quantity, orderId, orderItemId);
    }
    res.json({ success: true });
  });

  app.post("/api/orders/update-item-status", (req, res) => {
    const { orderId, orderItemId, status } = req.body;
    db.prepare("UPDATE order_items SET status = ? WHERE order_id = ? AND id = ?").run(status, orderId, orderItemId);
    res.json({ success: true });
  });

  app.post("/api/orders/update-item-details", (req, res) => {
    const { orderId, orderItemId, modifiers, notes } = req.body;
    
    // Calculate new price/extra price if needed, but since we get frontend `modifiers` with extraPrice, 
    // we just store it. Wait, the frontend calculates total dynamically!
    // Total is calculated using item.price + modifiers extraPrice.
    
    db.prepare("UPDATE order_items SET modifiers = ?, notes = ? WHERE order_id = ? AND id = ?")
      .run(JSON.stringify(modifiers), notes || '', orderId, orderItemId);
      
    res.json({ success: true });
  });

  app.post("/api/orders/remove-item", (req, res) => {
    const { orderId, orderItemId } = req.body;
    db.prepare("DELETE FROM order_items WHERE order_id = ? AND id = ?").run(orderId, orderItemId);
    res.json({ success: true });
  });

  app.get("/api/history", (req, res) => {
    // Filter for last 7 days
    const orders = db.prepare(`
      SELECT * FROM orders 
      WHERE status = 'CLOSED' 
      AND closed_at >= date('now', '-7 days')
      ORDER BY closed_at DESC
    `).all();
    const history = orders.map((o: any) => {
      const items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(o.id);
      return {
        ...o,
        items: items.map((i: any) => ({
          ...i,
          modifiers: i.modifiers ? JSON.parse(i.modifiers) : []
        }))
      };
    });
    res.json(history);
  });

  // Sales summary per table (last 7 days)
  app.get("/api/sales-summary", (req, res) => {
    const summary = db.prepare(`
      SELECT 
        table_id,
        COUNT(*) as total_orders,
        SUM(total) as total_revenue,
        SUM(tip) as total_tips,
        AVG(total) as avg_order_value,
        MAX(closed_at) as last_order_at
      FROM orders 
      WHERE status = 'CLOSED' 
      AND closed_at >= datetime('now', '-7 days')
      GROUP BY table_id
      ORDER BY total_revenue DESC
    `).all();
    res.json(summary);
  });

  app.post("/api/orders/migrate", (req, res) => {
    const { fromTableId, toTableId } = req.body;
    
    // Check if destination table is occupied
    const destinationOccupied = db.prepare("SELECT id FROM orders WHERE table_id = ? AND status = 'OPEN'").get(toTableId);
    if (destinationOccupied) {
      return res.status(400).json({ error: "La mesa de destino ya está ocupada" });
    }

    const update = db.prepare("UPDATE orders SET table_id = ? WHERE table_id = ? AND status = 'OPEN'");
    const result = update.run(toTableId, fromTableId);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: "No se encontró una orden activa en la mesa de origen" });
    }

    res.json({ success: true });
  });

  app.post("/api/tables/alias", (req, res) => {
    const { tableId, alias } = req.body;
    db.prepare("UPDATE tables SET alias = ? WHERE id = ?").run(alias || null, tableId);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
