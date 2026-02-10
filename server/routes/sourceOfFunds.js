const express = require('express');
const db = require('../db/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/source-of-funds
router.get('/', (req, res) => {
  let query = 'SELECT * FROM source_of_funds';
  const params = [];

  if (req.query.status) {
    query += ' WHERE status = ?';
    params.push(req.query.status);
  }

  query += ' ORDER BY date DESC';
  const rows = db.prepare(query).all(...params);
  res.json(rows);
});

// GET /api/source-of-funds/:id
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM source_of_funds WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Source of funds not found' });
  res.json(row);
});

// POST /api/source-of-funds (admin only)
router.post('/', requireAdmin, (req, res) => {
  const data = req.body;
  const result = db.prepare(`
    INSERT INTO source_of_funds (source_name, amount_funded, amount_remaining, status, date, remarks)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    data.source_name, data.amount_funded,
    data.amount_remaining !== undefined ? data.amount_remaining : data.amount_funded,
    data.status || 'Active', data.date, data.remarks
  );

  const created = db.prepare('SELECT * FROM source_of_funds WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(created);
});

// PUT /api/source-of-funds/:id (admin only)
router.put('/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM source_of_funds WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Source of funds not found' });

  const data = req.body;
  db.prepare(`
    UPDATE source_of_funds SET
      source_name = COALESCE(?, source_name),
      amount_funded = COALESCE(?, amount_funded),
      amount_remaining = COALESCE(?, amount_remaining),
      status = COALESCE(?, status),
      date = COALESCE(?, date),
      remarks = COALESCE(?, remarks)
    WHERE id = ?
  `).run(
    data.source_name, data.amount_funded, data.amount_remaining,
    data.status, data.date, data.remarks, req.params.id
  );

  const updated = db.prepare('SELECT * FROM source_of_funds WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE /api/source-of-funds/:id (admin only)
router.delete('/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM source_of_funds WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Source of funds not found' });

  db.prepare('DELETE FROM source_of_funds WHERE id = ?').run(req.params.id);
  res.json({ message: 'Source of funds deleted' });
});

module.exports = router;
