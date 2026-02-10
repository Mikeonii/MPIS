const express = require('express');
const db = require('../db/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/pharmacies
router.get('/', (req, res) => {
  let query = 'SELECT * FROM pharmacies';
  const params = [];

  if (req.query.status) {
    query += ' WHERE status = ?';
    params.push(req.query.status);
  }

  query += ' ORDER BY created_date DESC';
  const rows = db.prepare(query).all(...params);
  res.json(rows);
});

// GET /api/pharmacies/:id
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM pharmacies WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Pharmacy not found' });
  res.json(row);
});

// POST /api/pharmacies (admin only)
router.post('/', requireAdmin, (req, res) => {
  const data = req.body;
  const result = db.prepare(`
    INSERT INTO pharmacies (pharmacy_name, contact_person, contact_number, date_registered, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    data.pharmacy_name, data.contact_person, data.contact_number,
    data.date_registered, data.status || 'Active', req.user.email
  );

  const created = db.prepare('SELECT * FROM pharmacies WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(created);
});

// PUT /api/pharmacies/:id (admin only)
router.put('/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM pharmacies WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Pharmacy not found' });

  const data = req.body;
  db.prepare(`
    UPDATE pharmacies SET
      pharmacy_name = COALESCE(?, pharmacy_name),
      contact_person = COALESCE(?, contact_person),
      contact_number = COALESCE(?, contact_number),
      date_registered = COALESCE(?, date_registered),
      status = COALESCE(?, status)
    WHERE id = ?
  `).run(
    data.pharmacy_name, data.contact_person, data.contact_number,
    data.date_registered, data.status, req.params.id
  );

  const updated = db.prepare('SELECT * FROM pharmacies WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE /api/pharmacies/:id (admin only)
router.delete('/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM pharmacies WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Pharmacy not found' });

  db.prepare('DELETE FROM pharmacies WHERE id = ?').run(req.params.id);
  res.json({ message: 'Pharmacy deleted' });
});

module.exports = router;
