const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);
router.use(requireAdmin);

// GET /api/users
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM users ORDER BY created_date DESC').all();
  const users = rows.map(({ password_hash, ...user }) => user);
  res.json(users);
});

// GET /api/users/:id
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'User not found' });
  const { password_hash, ...user } = row;
  res.json(user);
});

// POST /api/users/invite
router.post('/invite', (req, res) => {
  const { email, password, role, full_name, position, username } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'A user with this email already exists' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const result = db.prepare(`
    INSERT INTO users (email, username, password_hash, full_name, position, role)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(email, username || email.split('@')[0], passwordHash, full_name, position, role || 'user');

  const created = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  const { password_hash, ...user } = created;
  res.status(201).json(user);
});

// PUT /api/users/:id
router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'User not found' });

  const data = req.body;

  // If password is being updated, hash it
  let passwordHash = null;
  if (data.password) {
    passwordHash = bcrypt.hashSync(data.password, 10);
  }

  db.prepare(`
    UPDATE users SET
      email = COALESCE(?, email),
      username = COALESCE(?, username),
      full_name = COALESCE(?, full_name),
      position = COALESCE(?, position),
      role = COALESCE(?, role),
      assistance_period = COALESCE(?, assistance_period)
      ${passwordHash ? ', password_hash = ?' : ''}
    WHERE id = ?
  `).run(
    ...[data.email, data.username, data.full_name, data.position, data.role, data.assistance_period],
    ...(passwordHash ? [passwordHash] : []),
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  const { password_hash, ...user } = updated;
  res.json(user);
});

// DELETE /api/users/:id
router.delete('/:id', (req, res) => {
  if (parseInt(req.params.id) === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }

  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'User not found' });

  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ message: 'User deleted' });
});

module.exports = router;
