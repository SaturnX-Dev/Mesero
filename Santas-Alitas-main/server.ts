import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";
import { Product, Category } from "./src/types";
import { MENU_DATA } from "./src/data";

const db = new Database("restaurant.db");

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
`);

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
    const rows = db.prepare("SELECT key, value FROM settings").all() as { key: string, value: string }[];
    const settings: Record<string, string> = {};
    rows.forEach(r => { settings[r.key] = r.value; });
    res.json(settings);
  });

  app.post("/api/settings", (req, res) => {
    const { key, value } = req.body;
    db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value")
      .run(key, value);
    res.json({ success: true });
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

  app.get("/api/tables", (req, res) => {
    const tables = db.prepare("SELECT * FROM tables").all();
    // Get active order status for each table
    const tablesWithStatus = tables.map((t: any) => {
      const activeOrder = db.prepare("SELECT id FROM orders WHERE table_id = ? AND status = 'OPEN'").get(t.id);
      return { ...t, isOccupied: !!activeOrder };
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
    const { tableId, item } = req.body;
    
    let order = db.prepare("SELECT id FROM orders WHERE table_id = ? AND status = 'OPEN'").get(tableId) as any;
    
    if (!order) {
      const orderId = Math.random().toString(36).substr(2, 9);
      db.prepare("INSERT INTO orders (id, table_id) VALUES (?, ?)").run(orderId, tableId);
      order = { id: orderId };
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

    res.json({ success: true });
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
