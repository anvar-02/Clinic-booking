CREATE TABLE IF NOT EXISTS doctor_schedules (
  id SERIAL PRIMARY KEY,
  doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  weekday SMALLINT NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL CHECK (end_time > start_time),
  slot_minutes SMALLINT NOT NULL DEFAULT 30 CHECK (slot_minutes IN (15, 30, 45, 60)),
  UNIQUE (doctor_id, weekday)
);

CREATE TABLE IF NOT EXISTS doctor_days_off (
  id SERIAL PRIMARY KEY,
  doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  day_off DATE NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  UNIQUE (doctor_id, day_off)
);

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS duration_minutes SMALLINT NOT NULL DEFAULT 30
  CHECK (duration_minutes IN (15, 30, 45, 60));
