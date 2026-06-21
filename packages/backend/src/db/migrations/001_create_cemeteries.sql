-- Migration 001: Create cemeteries table
CREATE TABLE IF NOT EXISTS cemeteries (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  description   TEXT,
  address       TEXT    NOT NULL,
  city          TEXT    NOT NULL,
  state         TEXT    NOT NULL,
  zip           TEXT,
  country       TEXT    NOT NULL DEFAULT 'US',
  latitude      REAL    NOT NULL,
  longitude     REAL    NOT NULL,
  phone         TEXT,
  website       TEXT,
  hours         TEXT,
  services      TEXT,
  image_url     TEXT,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_cemeteries_location ON cemeteries(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_cemeteries_city_state ON cemeteries(city, state);
CREATE INDEX IF NOT EXISTS idx_cemeteries_name ON cemeteries(name);