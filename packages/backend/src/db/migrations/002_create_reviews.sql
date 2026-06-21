-- Migration 002: Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  cemetery_id   INTEGER NOT NULL REFERENCES cemeteries(id) ON DELETE CASCADE,
  author_name   TEXT    NOT NULL,
  author_email  TEXT,
  rating        INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
  comment       TEXT,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_reviews_cemetery ON reviews(cemetery_id);

-- Create cemetery_stats table for denormalized aggregates
CREATE TABLE IF NOT EXISTS cemetery_stats (
  cemetery_id   INTEGER PRIMARY KEY REFERENCES cemeteries(id) ON DELETE CASCADE,
  avg_rating    REAL    DEFAULT 0,
  review_count  INTEGER DEFAULT 0
);

-- Trigger: update stats on review insert
CREATE TRIGGER IF NOT EXISTS trg_review_insert
AFTER INSERT ON reviews
BEGIN
  INSERT INTO cemetery_stats (cemetery_id, avg_rating, review_count)
  VALUES (
    NEW.cemetery_id,
    (SELECT ROUND(AVG(CAST(rating AS REAL)), 2) FROM reviews WHERE cemetery_id = NEW.cemetery_id),
    (SELECT COUNT(*) FROM reviews WHERE cemetery_id = NEW.cemetery_id)
  )
  ON CONFLICT(cemetery_id) DO UPDATE SET
    avg_rating = (SELECT ROUND(AVG(CAST(rating AS REAL)), 2) FROM reviews WHERE cemetery_id = NEW.cemetery_id),
    review_count = (SELECT COUNT(*) FROM reviews WHERE cemetery_id = NEW.cemetery_id);
END;

-- Trigger: update stats on review delete
CREATE TRIGGER IF NOT EXISTS trg_review_delete
AFTER DELETE ON reviews
BEGIN
  UPDATE cemetery_stats SET
    avg_rating = COALESCE((SELECT ROUND(AVG(CAST(rating AS REAL)), 2) FROM reviews WHERE cemetery_id = OLD.cemetery_id), 0),
    review_count = (SELECT COUNT(*) FROM reviews WHERE cemetery_id = OLD.cemetery_id)
  WHERE cemetery_id = OLD.cemetery_id;
END;

-- Trigger: initialize stats when a cemetery is created
CREATE TRIGGER IF NOT EXISTS trg_cemetery_insert
AFTER INSERT ON cemeteries
BEGIN
  INSERT OR IGNORE INTO cemetery_stats (cemetery_id, avg_rating, review_count)
  VALUES (NEW.id, 0, 0);
END;