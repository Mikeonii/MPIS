const express = require('express');
const db = require('../db/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/assistances
router.get('/', (req, res) => {
  let query = 'SELECT * FROM assistances';
  const conditions = [];
  const params = [];

  // Filter by account_id
  if (req.query.account_id) {
    conditions.push('account_id = ?');
    params.push(req.query.account_id);
  }

  // RBAC: non-admin users only see their own records
  if (req.user.role !== 'admin') {
    conditions.push('created_by = ?');
    params.push(req.user.email);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY created_date DESC';

  if (req.query.limit) {
    query += ' LIMIT ?';
    params.push(parseInt(req.query.limit));
  }

  const rows = db.prepare(query).all(...params);

  const parsed = rows.map(row => ({
    ...row,
    medicines: row.medicines ? JSON.parse(row.medicines) : []
  }));

  res.json(parsed);
});

// GET /api/assistances/:id
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM assistances WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Assistance not found' });

  if (req.user.role !== 'admin' && row.created_by !== req.user.email) {
    return res.status(403).json({ error: 'Access denied' });
  }

  row.medicines = row.medicines ? JSON.parse(row.medicines) : [];
  res.json(row);
});

// POST /api/assistances
router.post('/', (req, res) => {
  try {
    const data = req.body;
    const medicines = Array.isArray(data.medicines)
      ? JSON.stringify(data.medicines)
      : data.medicines || '[]';

    // Convert to proper types - null for empty, integer for FK columns
    const accountId = data.account_id ? parseInt(data.account_id, 10) : null;
    const sourceOfFundsId = data.source_of_funds_id ? parseInt(data.source_of_funds_id, 10) : null;
    const pharmacyId = data.pharmacy_id ? parseInt(data.pharmacy_id, 10) : null;
    const amount = data.amount ? parseFloat(data.amount) : null;

    const result = db.prepare(`
      INSERT INTO assistances (
        account_id, type_of_assistance, medical_subcategory, medicines, amount,
        source_of_funds_id, source_of_funds_name, pharmacy_id, pharmacy_name,
        interviewed_by, interviewed_by_position, date_rendered, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      accountId, data.type_of_assistance, data.medical_subcategory || null,
      medicines, amount, sourceOfFundsId, data.source_of_funds_name || null,
      pharmacyId, data.pharmacy_name || null, data.interviewed_by,
      data.interviewed_by_position, data.date_rendered, req.user.email
    );

    // Update source_of_funds amount_remaining if provided
    if (sourceOfFundsId && amount) {
      const fund = db.prepare('SELECT * FROM source_of_funds WHERE id = ?').get(sourceOfFundsId);
      if (fund) {
        const newRemaining = (fund.amount_remaining || 0) - amount;
        const newStatus = newRemaining <= 0 ? 'Depleted' : 'Active';
        db.prepare('UPDATE source_of_funds SET amount_remaining = ?, status = ? WHERE id = ?')
          .run(Math.max(0, newRemaining), newStatus, sourceOfFundsId);
      }
    }

    const created = db.prepare('SELECT * FROM assistances WHERE id = ?').get(result.lastInsertRowid);
    created.medicines = created.medicines ? JSON.parse(created.medicines) : [];
    res.status(201).json(created);
  } catch (err) {
    console.error('Error creating assistance:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/assistances/:id
router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM assistances WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Assistance not found' });

  if (req.user.role !== 'admin' && existing.created_by !== req.user.email) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const data = req.body;
  const medicines = Array.isArray(data.medicines)
    ? JSON.stringify(data.medicines)
    : data.medicines || existing.medicines;

  // Convert empty strings to null for foreign key columns
  const sourceOfFundsId = data.source_of_funds_id || null;
  const pharmacyId = data.pharmacy_id || null;

  db.prepare(`
    UPDATE assistances SET
      account_id = COALESCE(?, account_id),
      type_of_assistance = COALESCE(?, type_of_assistance),
      medical_subcategory = COALESCE(?, medical_subcategory),
      medicines = ?,
      amount = COALESCE(?, amount),
      source_of_funds_id = COALESCE(?, source_of_funds_id),
      source_of_funds_name = COALESCE(?, source_of_funds_name),
      pharmacy_id = COALESCE(?, pharmacy_id),
      pharmacy_name = COALESCE(?, pharmacy_name),
      interviewed_by = COALESCE(?, interviewed_by),
      interviewed_by_position = COALESCE(?, interviewed_by_position),
      date_rendered = COALESCE(?, date_rendered),
      updated_date = datetime('now')
    WHERE id = ?
  `).run(
    data.account_id, data.type_of_assistance, data.medical_subcategory || null,
    medicines, data.amount, sourceOfFundsId, data.source_of_funds_name || null,
    pharmacyId, data.pharmacy_name || null, data.interviewed_by,
    data.interviewed_by_position, data.date_rendered, req.params.id
  );

  const updated = db.prepare('SELECT * FROM assistances WHERE id = ?').get(req.params.id);
  updated.medicines = updated.medicines ? JSON.parse(updated.medicines) : [];
  res.json(updated);
});

// DELETE /api/assistances/:id
router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM assistances WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Assistance not found' });

  if (req.user.role !== 'admin' && existing.created_by !== req.user.email) {
    return res.status(403).json({ error: 'Access denied' });
  }

  db.prepare('DELETE FROM assistances WHERE id = ?').run(req.params.id);
  res.json({ message: 'Assistance deleted' });
});

module.exports = router;
