const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const initSqlJs = require('sql.js');

const DB_PATH = path.join(__dirname, 'mpis.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

let sqlDb = null;
let inTransaction = false;

function saveDb() {
  if (sqlDb) {
    const data = sqlDb.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  }
}

const db = {
  async init() {
    const SQL = await initSqlJs();

    if (fs.existsSync(DB_PATH)) {
      try {
        const buffer = fs.readFileSync(DB_PATH);
        sqlDb = new SQL.Database(buffer);
      } catch (e) {
        console.warn('Could not read existing database, creating new one:', e.message);
        sqlDb = new SQL.Database();
      }
    } else {
      sqlDb = new SQL.Database();
    }

    // Enable foreign keys
    sqlDb.run('PRAGMA foreign_keys = ON');

    // Run schema to create tables if they don't exist
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
    sqlDb.exec(schema);

    // Seed default admin user if no users exist
    const result = sqlDb.exec('SELECT COUNT(*) as count FROM users');
    const count = result[0]?.values[0]?.[0] || 0;
    if (count === 0) {
      const passwordHash = bcrypt.hashSync('admin123', 10);
      sqlDb.run(
        'INSERT INTO users (email, username, password_hash, full_name, position, role) VALUES (?, ?, ?, ?, ?, ?)',
        ['admin@mpis.com', 'admin', passwordHash, 'System Administrator', 'Administrator', 'admin']
      );
      saveDb();
      console.log('Default admin user seeded (admin@mpis.com / admin123)');
    }

    // Save on exit
    process.on('SIGINT', () => { saveDb(); process.exit(); });
    process.on('SIGTERM', () => { saveDb(); process.exit(); });

    console.log('Database initialized');
    return db;
  },

  prepare(sql) {
    return {
      get(...params) {
        const stmt = sqlDb.prepare(sql);
        if (params.length > 0) stmt.bind(params);
        let row = undefined;
        if (stmt.step()) {
          row = stmt.getAsObject();
        }
        stmt.free();
        return row;
      },

      all(...params) {
        const stmt = sqlDb.prepare(sql);
        if (params.length > 0) stmt.bind(params);
        const rows = [];
        while (stmt.step()) {
          rows.push(stmt.getAsObject());
        }
        stmt.free();
        return rows;
      },

      run(...params) {
        if (params.length > 0) {
          sqlDb.run(sql, params);
        } else {
          sqlDb.run(sql);
        }
        const lastId = sqlDb.exec('SELECT last_insert_rowid()')[0]?.values[0]?.[0];
        const changes = sqlDb.getRowsModified();
        if (!inTransaction) saveDb();
        return { lastInsertRowid: lastId, changes };
      }
    };
  },

  exec(sql) {
    sqlDb.exec(sql);
    saveDb();
  },

  pragma(str) {
    sqlDb.run(`PRAGMA ${str}`);
  },

  transaction(fn) {
    return (...args) => {
      sqlDb.run('BEGIN TRANSACTION');
      inTransaction = true;
      try {
        const result = fn(...args);
        sqlDb.run('COMMIT');
        inTransaction = false;
        saveDb();
        return result;
      } catch (e) {
        sqlDb.run('ROLLBACK');
        inTransaction = false;
        throw e;
      }
    };
  }
};

module.exports = db;
