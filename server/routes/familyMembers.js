const express = require('express');
const db = require('../db/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/family-members
router.get('/', (req, res) => {
  let query = 'SELECT * FROM family_members';
  const params = [];

  if (req.query.account_id) {
    query += ' WHERE account_id = ?';
    params.push(req.query.account_id);
  }

  query += ' ORDER BY created_date DESC';
  const rows = db.prepare(query).all(...params);
  res.json(rows);
});

// GET /api/family-members/:id
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM family_members WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Family member not found' });
  res.json(row);
});

// POST /api/family-members
router.post('/', (req, res) => {
  const { account_id, complete_name, relationship } = req.body;
  const result = db.prepare(`
    INSERT INTO family_members (account_id, complete_name, relationship)
    VALUES (?, ?, ?)
  `).run(account_id, complete_name, relationship);

  const created = db.prepare('SELECT * FROM family_members WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(created);
});

// POST /api/family-members/batch
router.post('/batch', (req, res) => {
  const { account_id, members } = req.body;
  if (!Array.isArray(members)) {
    return res.status(400).json({ error: 'members must be an array' });
  }

  const insert = db.prepare(`
    INSERT INTO family_members (account_id, complete_name, relationship)
    VALUES (?, ?, ?)
  `);

  const insertMany = db.transaction((members) => {
    for (const member of members) {
      insert.run(account_id, member.complete_name, member.relationship);
    }
  });

  insertMany(members);
  const rows = db.prepare('SELECT * FROM family_members WHERE account_id = ?').all(account_id);
  res.status(201).json(rows);
});

// DELETE /api/family-members/:id
router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM family_members WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Family member not found' });

  db.prepare('DELETE FROM family_members WHERE id = ?').run(req.params.id);
  res.json({ message: 'Family member deleted' });
});

// DELETE /api/family-members/by-account/:accountId - delete all family members for an account
router.delete('/by-account/:accountId', (req, res) => {
  db.prepare('DELETE FROM family_members WHERE account_id = ?').run(req.params.accountId);
  res.json({ message: 'Family members deleted' });
});

module.exports = router;
