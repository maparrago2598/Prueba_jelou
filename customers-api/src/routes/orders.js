const express = require('express');
const pool = require('../db/connection');
const axios = require('axios');
const router = express.Router();

// POST /orders - Creación con Transacción [cite: 27]
router.post('/', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { customer_id, items } = req.body;

    // Validar cliente internamente [cite: 23, 27]
    await axios.get(`${process.env.CUSTOMERS_API_URL}/internal/${customer_id}`, {
      headers: { Authorization: `Bearer ${process.env.SERVICE_TOKEN}` }
    });

    let totalCents = 0;
    for (const item of items) {
      // Bloqueo de fila para evitar condiciones de carrera (Stock Check) [cite: 27]
      const [prod] = await connection.query('SELECT stock, price_cents FROM products WHERE id = ? FOR UPDATE', [item.product_id]);
      if (prod[0].stock < item.qty) throw new Error('Stock insuficiente');
      
      totalCents += prod[0].price_cents * item.qty;
      await connection.query('UPDATE products SET stock = stock - ? WHERE id = ?', [item.qty, item.product_id]);
    }

    const [order] = await connection.query('INSERT INTO orders (customer_id, total_cents, status) VALUES (?, ?, "CREATED")', [customer_id, totalCents]);
    
    await connection.commit();
    res.status(201).json({ id: order.insertId, status: 'CREATED' });
  } catch (err) {
    await connection.rollback();
    res.status(400).json({ error: err.message });
  } finally {
    connection.release();
  }
});

// POST /orders/:id/confirm - Idempotente 
router.post('/:id/confirm', async (req, res) => {
  const key = req.headers['x-idempotency-key'];
  if (!key) return res.status(400).json({ error: 'X-Idempotency-Key requerida' });

  // Verificar si la llave ya fue procesada [cite: 43]
  const [existing] = await pool.query('SELECT response_body FROM idempotency_keys WHERE `key` = ?', [key]);
  if (existing.length) return res.json(existing[0].response_body);

  // Lógica de confirmación...
  const response = { message: 'Pedido confirmado', order_id: req.params.id };
  
  // Guardar resultado para futuros reintentos [cite: 43, 57]
  await pool.query('INSERT INTO idempotency_keys (`key`, target_type, target_id, response_body) VALUES (?, "order", ?, ?)', 
    [key, req.params.id, JSON.stringify(response)]);
    
  res.json(response);
});

module.exports = router;