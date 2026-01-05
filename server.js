
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// MySQL Connection Configuration
// IMPORTANT: Change 'your_password' to your actual MySQL root password!
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'your_password', 
  database: 'optimaster_db'
};

const getDB = async () => {
  try {
    return await mysql.createConnection(dbConfig);
  } catch (err) {
    console.error("CRITICAL: Could not connect to MySQL Database.");
    console.error("Reason:", err.message);
    throw err;
  }
};

// Verify Database Connection on Startup
async function testConnection() {
  try {
    const db = await getDB();
    console.log('✅ Connected to MySQL: optimaster_db');
    await db.end();
  } catch (err) {
    console.log('❌ DATABASE ERROR: Verify your MySQL service is running and password is correct in server.js');
  }
}
testConnection();

/**
 * AUTH API
 */
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const db = await getDB();
    const [rows] = await db.execute(
      'SELECT id, email, name FROM users WHERE email = ? AND password = ?',
      [email, password]
    );
    await db.end();
    
    if (rows.length > 0) {
      res.json({ success: true, user: rows[0] });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error("Login attempt failed:", error.message);
    res.status(500).json({ success: false, message: "Server Database Error" });
  }
});

/**
 * SUPPLIERS API
 */
app.get('/api/suppliers', async (req, res) => {
  try {
    const db = await getDB();
    const [rows] = await db.execute('SELECT * FROM suppliers ORDER BY id DESC');
    await db.end();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/suppliers', async (req, res) => {
  const { name, mobile, address } = req.body;
  try {
    const db = await getDB();
    const [result] = await db.execute(
      'INSERT INTO suppliers (name, mobile, address) VALUES (?, ?, ?)',
      [name, mobile, address]
    );
    await db.end();
    res.json({ id: result.insertId.toString(), name, mobile, address });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/suppliers/:id', async (req, res) => {
  const { id } = req.params;
  const { name, mobile, address } = req.body;
  try {
    const db = await getDB();
    await db.execute(
      'UPDATE suppliers SET name = ?, mobile = ?, address = ? WHERE id = ?',
      [name, mobile, address, id]
    );
    await db.end();
    res.json({ id, name, mobile, address });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * INVENTORY API
 */
app.get('/api/inventory', async (req, res) => {
  try {
    const db = await getDB();
    const [rows] = await db.execute('SELECT * FROM inventory ORDER BY id DESC');
    await db.end();
    res.json(rows.map(r => ({...r, id: r.id.toString(), supplierId: r.supplierId?.toString()})));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/inventory', async (req, res) => {
  const { name, category, sku, quantity, costPrice, sellingPrice, supplierId, description } = req.body;
  try {
    const db = await getDB();
    const [result] = await db.execute(
      'INSERT INTO inventory (name, category, sku, quantity, costPrice, sellingPrice, supplierId, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, category, sku, quantity, costPrice, sellingPrice, supplierId, description]
    );
    await db.end();
    res.json({ id: result.insertId.toString(), ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/inventory/:id/stock', async (req, res) => {
  const { id } = req.params;
  const { quantityChange } = req.body;
  try {
    const db = await getDB();
    await db.execute('UPDATE inventory SET quantity = quantity + ? WHERE id = ?', [quantityChange, id]);
    await db.end();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * SALES API
 */
app.get('/api/sales', async (req, res) => {
  try {
    const db = await getDB();
    const [sales] = await db.execute('SELECT * FROM sales ORDER BY date DESC');
    const result = [];
    for (const sale of sales) {
      const [items] = await db.execute('SELECT * FROM sale_items WHERE saleId = ?', [sale.id]);
      result.push({ 
        ...sale, 
        id: `INV-${sale.id}`, 
        items: items.map(i => ({...i, itemId: i.itemId.toString()})) 
      });
    }
    await db.end();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sales', async (req, res) => {
  const { customerName, customerEmail, customerMobile, customerPlace, items, totalPrice, advancePaid, discount, subTotal } = req.body;
  const balance = totalPrice - advancePaid;
  const db = await getDB();
  
  await db.beginTransaction();
  try {
    const [saleResult] = await db.execute(
      'INSERT INTO sales (customerName, customerEmail, customerMobile, customerPlace, totalPrice, advancePaid, balance, discount, subTotal, status, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, "Pending", NOW())',
      [customerName, customerEmail, customerMobile, customerPlace, totalPrice, advancePaid, balance, discount, subTotal]
    );
    const saleId = saleResult.insertId;

    for (const item of items) {
      const [inv] = await db.execute('SELECT costPrice, sku FROM inventory WHERE id = ?', [item.itemId]);
      const cost = inv[0]?.costPrice || 0;
      const sku = inv[0]?.sku || '';

      await db.execute(
        'INSERT INTO sale_items (saleId, itemId, name, sku, quantity, unitPrice, unitCostPrice, subTotal) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [saleId, item.itemId, item.name, sku, item.quantity, item.unitPrice, cost, item.subTotal]
      );
      await db.execute(
        'UPDATE inventory SET quantity = quantity - ? WHERE id = ?',
        [item.quantity, item.itemId]
      );
    }

    await db.commit();
    await db.end();
    res.json({ id: `INV-${saleId}`, date: new Date().toISOString(), balance, status: "Pending" });
  } catch (error) {
    await db.rollback();
    await db.end();
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/sales/:id/status', async (req, res) => {
  let { id } = req.params;
  const { status, paymentReceived } = req.body;
  
  if (id.startsWith('INV-')) {
    id = id.replace('INV-', '');
  }

  const db = await getDB();
  try {
    await db.beginTransaction();
    
    if (paymentReceived) {
      await db.execute('UPDATE sales SET advancePaid = advancePaid + ?, balance = GREATEST(0, balance - ?) WHERE id = ?', [paymentReceived, paymentReceived, id]);
    }
    
    await db.execute('UPDATE sales SET status = ? WHERE id = ?', [status, id]);

    if (status === 'Cancelled') {
      const [items] = await db.execute('SELECT itemId, quantity FROM sale_items WHERE saleId = ?', [id]);
      for (const item of items) {
        await db.execute('UPDATE inventory SET quantity = quantity + ? WHERE id = ?', [item.quantity, item.itemId]);
      }
    }

    await db.commit();
    await db.end();
    res.json({ success: true });
  } catch (error) {
    await db.rollback();
    await db.end();
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log('🚀 OptiMaster API listening on port 3000'));
