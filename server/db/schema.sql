CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  username TEXT,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  position TEXT,
  role TEXT DEFAULT 'user' CHECK(role IN ('admin', 'user')),
  assistance_period INTEGER DEFAULT 90,
  created_date TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name TEXT,
  middle_name TEXT,
  last_name TEXT,
  extension_name TEXT,
  gender TEXT,
  civil_status TEXT,
  birthdate TEXT,
  mobile_number TEXT,
  house_number TEXT,
  street TEXT,
  purok TEXT,
  barangay TEXT,
  city_municipality TEXT,
  city_municipality_code TEXT,
  district TEXT,
  province TEXT,
  region TEXT,
  occupation TEXT,
  monthly_income TEXT,
  rep_same_as_holder INTEGER DEFAULT 0,
  rep_first_name TEXT,
  rep_middle_name TEXT,
  rep_last_name TEXT,
  rep_extension_name TEXT,
  rep_mobile_number TEXT,
  rep_birthdate TEXT,
  rep_house_number TEXT,
  rep_street TEXT,
  rep_purok TEXT,
  rep_barangay TEXT,
  rep_city_municipality TEXT,
  rep_city_municipality_code TEXT,
  rep_district TEXT,
  rep_province TEXT,
  rep_region TEXT,
  target_sector TEXT,
  sub_categories TEXT,
  created_date TEXT DEFAULT (datetime('now')),
  created_by TEXT,
  updated_date TEXT
);

CREATE TABLE IF NOT EXISTS assistances (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL,
  type_of_assistance TEXT,
  medical_subcategory TEXT,
  medicines TEXT,
  amount REAL,
  source_of_funds_id INTEGER,
  source_of_funds_name TEXT,
  pharmacy_id INTEGER,
  pharmacy_name TEXT,
  interviewed_by TEXT,
  interviewed_by_position TEXT,
  date_rendered TEXT,
  created_date TEXT DEFAULT (datetime('now')),
  created_by TEXT,
  updated_date TEXT,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (source_of_funds_id) REFERENCES source_of_funds(id),
  FOREIGN KEY (pharmacy_id) REFERENCES pharmacies(id)
);

CREATE TABLE IF NOT EXISTS family_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL,
  complete_name TEXT,
  relationship TEXT,
  created_date TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pharmacies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pharmacy_name TEXT,
  contact_person TEXT,
  contact_number TEXT,
  date_registered TEXT,
  status TEXT DEFAULT 'Active' CHECK(status IN ('Active', 'Inactive')),
  created_date TEXT DEFAULT (datetime('now')),
  created_by TEXT
);

CREATE TABLE IF NOT EXISTS source_of_funds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_name TEXT,
  amount_funded REAL,
  amount_remaining REAL,
  status TEXT DEFAULT 'Active' CHECK(status IN ('Active', 'Depleted')),
  date TEXT,
  remarks TEXT,
  created_date TEXT DEFAULT (datetime('now'))
);
