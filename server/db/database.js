const path = require('path');
const Database = require('better-sqlite3');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'mpis.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrency and foreign keys
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Run schema to create tables if they don't exist
const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
db.exec(schema);

// Seed default admin user if no users exist
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
if (userCount.count === 0) {
  const passwordHash = bcrypt.hashSync('admin123', 10);
  db.prepare(`
    INSERT INTO users (email, username, password_hash, full_name, position, role)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('admin@mpis.com', 'admin', passwordHash, 'System Administrator', 'Administrator', 'admin');
  console.log('Default admin user seeded (admin@mpis.com / admin123)');
}

module.exports = db;
