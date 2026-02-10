const express = require('express');
const db = require('../db/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/accounts
router.get('/', (req, res) => {
  let query = 'SELECT * FROM accounts';
  const params = [];

  // RBAC: non-admin users only see their own records
  if (req.user.role !== 'admin') {
    query += ' WHERE created_by = ?';
    params.push(req.user.email);
  }

  query += ' ORDER BY created_date DESC';
  const rows = db.prepare(query).all(...params);

  // Parse JSON fields
  const parsed = rows.map(row => ({
    ...row,
    sub_categories: row.sub_categories ? JSON.parse(row.sub_categories) : []
  }));

  res.json(parsed);
});

// GET /api/accounts/:id
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM accounts WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Account not found' });

  // RBAC check
  if (req.user.role !== 'admin' && row.created_by !== req.user.email) {
    return res.status(403).json({ error: 'Access denied' });
  }

  row.sub_categories = row.sub_categories ? JSON.parse(row.sub_categories) : [];
  res.json(row);
});

// POST /api/accounts
router.post('/', (req, res) => {
  const data = req.body;
  const sub_categories = Array.isArray(data.sub_categories)
    ? JSON.stringify(data.sub_categories)
    : data.sub_categories || '[]';

  const stmt = db.prepare(`
    INSERT INTO accounts (
      first_name, middle_name, last_name, extension_name, gender, civil_status,
      birthdate, mobile_number, house_number, street, purok, barangay,
      city_municipality, city_municipality_code, district, province, region,
      occupation, monthly_income, rep_same_as_holder, rep_first_name, rep_middle_name,
      rep_last_name, rep_extension_name, rep_mobile_number, rep_birthdate,
      rep_house_number, rep_street, rep_purok, rep_barangay, rep_city_municipality,
      rep_city_municipality_code, rep_district, rep_province, rep_region,
      target_sector, sub_categories, created_by
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?
    )
  `);

  const result = stmt.run(
    data.first_name, data.middle_name, data.last_name, data.extension_name,
    data.gender, data.civil_status, data.birthdate, data.mobile_number,
    data.house_number, data.street, data.purok, data.barangay,
    data.city_municipality, data.city_municipality_code, data.district,
    data.province, data.region, data.occupation, data.monthly_income,
    data.rep_same_as_holder ? 1 : 0, data.rep_first_name, data.rep_middle_name,
    data.rep_last_name, data.rep_extension_name, data.rep_mobile_number,
    data.rep_birthdate, data.rep_house_number, data.rep_street, data.rep_purok,
    data.rep_barangay, data.rep_city_municipality, data.rep_city_municipality_code,
    data.rep_district, data.rep_province, data.rep_region,
    data.target_sector, sub_categories, req.user.email
  );

  const created = db.prepare('SELECT * FROM accounts WHERE id = ?').get(result.lastInsertRowid);
  created.sub_categories = created.sub_categories ? JSON.parse(created.sub_categories) : [];
  res.status(201).json(created);
});

// PUT /api/accounts/:id
router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM accounts WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Account not found' });

  if (req.user.role !== 'admin' && existing.created_by !== req.user.email) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const data = req.body;
  const sub_categories = Array.isArray(data.sub_categories)
    ? JSON.stringify(data.sub_categories)
    : data.sub_categories || existing.sub_categories;

  db.prepare(`
    UPDATE accounts SET
      first_name = COALESCE(?, first_name), middle_name = COALESCE(?, middle_name),
      last_name = COALESCE(?, last_name), extension_name = COALESCE(?, extension_name),
      gender = COALESCE(?, gender), civil_status = COALESCE(?, civil_status),
      birthdate = COALESCE(?, birthdate), mobile_number = COALESCE(?, mobile_number),
      house_number = COALESCE(?, house_number), street = COALESCE(?, street),
      purok = COALESCE(?, purok), barangay = COALESCE(?, barangay),
      city_municipality = COALESCE(?, city_municipality),
      city_municipality_code = COALESCE(?, city_municipality_code),
      district = COALESCE(?, district), province = COALESCE(?, province),
      region = COALESCE(?, region), occupation = COALESCE(?, occupation),
      monthly_income = COALESCE(?, monthly_income),
      rep_same_as_holder = COALESCE(?, rep_same_as_holder),
      rep_first_name = COALESCE(?, rep_first_name), rep_middle_name = COALESCE(?, rep_middle_name),
      rep_last_name = COALESCE(?, rep_last_name), rep_extension_name = COALESCE(?, rep_extension_name),
      rep_mobile_number = COALESCE(?, rep_mobile_number), rep_birthdate = COALESCE(?, rep_birthdate),
      rep_house_number = COALESCE(?, rep_house_number), rep_street = COALESCE(?, rep_street),
      rep_purok = COALESCE(?, rep_purok), rep_barangay = COALESCE(?, rep_barangay),
      rep_city_municipality = COALESCE(?, rep_city_municipality),
      rep_city_municipality_code = COALESCE(?, rep_city_municipality_code),
      rep_district = COALESCE(?, rep_district), rep_province = COALESCE(?, rep_province),
      rep_region = COALESCE(?, rep_region),
      target_sector = COALESCE(?, target_sector), sub_categories = ?,
      updated_date = datetime('now')
    WHERE id = ?
  `).run(
    data.first_name, data.middle_name, data.last_name, data.extension_name,
    data.gender, data.civil_status, data.birthdate, data.mobile_number,
    data.house_number, data.street, data.purok, data.barangay,
    data.city_municipality, data.city_municipality_code, data.district,
    data.province, data.region, data.occupation, data.monthly_income,
    data.rep_same_as_holder !== undefined ? (data.rep_same_as_holder ? 1 : 0) : null,
    data.rep_first_name, data.rep_middle_name, data.rep_last_name, data.rep_extension_name,
    data.rep_mobile_number, data.rep_birthdate, data.rep_house_number, data.rep_street,
    data.rep_purok, data.rep_barangay, data.rep_city_municipality,
    data.rep_city_municipality_code, data.rep_district, data.rep_province,
    data.rep_region, data.target_sector, sub_categories,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM accounts WHERE id = ?').get(req.params.id);
  updated.sub_categories = updated.sub_categories ? JSON.parse(updated.sub_categories) : [];
  res.json(updated);
});

// DELETE /api/accounts/:id
router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM accounts WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Account not found' });

  if (req.user.role !== 'admin' && existing.created_by !== req.user.email) {
    return res.status(403).json({ error: 'Access denied' });
  }

  db.prepare('DELETE FROM accounts WHERE id = ?').run(req.params.id);
  res.json({ message: 'Account deleted' });
});

module.exports = router;
