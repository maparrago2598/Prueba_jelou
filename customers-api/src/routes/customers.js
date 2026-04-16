const express = require('express');
const { z } = require('zod');
const pool = require('../db/connection');
const { authJWT, authService } = require('../middleware/auth');

const router = express.Router();

const customerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
});

// POST /customers
router.post('/', authJWT, async (req, res) => {
  try {
    const data = customerSchema.parse(req.body);
    const [result] = await pool.query(
      'INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)',
      [data.name, data.email, data.phone || null]
    );
    const [rows] = await pool.query('SELECT * FROM customers WHERE id = ?', [result.insertId]);
    return res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'Email ya existe' });
    return res.status(400).json({ error: err.message });
  }
});

// GET /customers
router.get('/', authJWT, async (req, res) => {
  try {
    const { search = '', cursor = 0, limit = 10 } = req.query;
    const [rows] = await pool.query(
      `SELECT * FROM customers 
       WHERE deleted_at IS NULL 
       AND id > ? 
       AND (name LIKE ? OR email LIKE ?)
       LIMIT ?`,
      [Number(cursor), `%${search}%`, `%${search}%`, Number(limit)]
    );
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /customers/:id
router.get('/:id', authJWT, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM customers WHERE id = ? AND deleted_at IS NULL',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Cliente no encontrado' });
    return res.json(rows[0]);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /customers/:id
router.put('/:id', authJWT, async (req, res) => {
  try {
    const data = customerSchema.partial().parse(req.body);
    await pool.query(
      'UPDATE customers SET name=COALESCE(?,name), email=COALESCE(?,email), phone=COALESCE(?,phone) WHERE id=?',
      [data.name || null, data.email || null, data.phone || null, req.params.id]
    );
    const [rows] = await pool.query('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    return res.json(rows[0]);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// DELETE /customers/:id (soft-delete)
router.delete('/:id', authJWT, async (req, res) => {
  try {
    await pool.query(
      'UPDATE customers SET deleted_at = NOW() WHERE id = ?',
      [req.params.id]
    );
    return res.json({ message: 'Cliente eliminado' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /internal/customers/:id
router.get('/internal/:id', authService, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM customers WHERE id = ? AND deleted_at IS NULL',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Cliente no encontrado' });
    return res.json(rows[0]);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;