-- ============================================================
-- WINGS Counselling Centre – PostgreSQL Schema
-- Run once: psql -U postgres -d Wings -f schema.postgresql.sql
-- ============================================================

-- ─── Team Members ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_members (
  id              SERIAL PRIMARY KEY,
  name            TEXT NOT NULL,
  title           TEXT NOT NULL,
  role            TEXT NOT NULL DEFAULT 'counsellor',
  bio             TEXT NOT NULL DEFAULT '',
  credentials     JSONB NOT NULL DEFAULT '[]',
  specialisations JSONB NOT NULL DEFAULT '[]',
  photo_url       TEXT,
  email           TEXT,
  display_order   INT NOT NULL DEFAULT 0,
  is_visible      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── Articles ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS articles (
  id           SERIAL PRIMARY KEY,
  title        TEXT NOT NULL,
  slug         VARCHAR(500) NOT NULL UNIQUE,
  excerpt      TEXT NOT NULL DEFAULT '',
  content      TEXT NOT NULL DEFAULT '',
  cover_image  TEXT,
  author       TEXT NOT NULL DEFAULT 'WINGS Team',
  category     TEXT NOT NULL DEFAULT 'General',
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMP,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── Careers / Jobs ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS careers (
  id              SERIAL PRIMARY KEY,
  job_id          VARCHAR(100) UNIQUE,
  title           TEXT NOT NULL,
  department      TEXT NOT NULL DEFAULT '',
  location        TEXT NOT NULL DEFAULT 'Kuala Lumpur',
  description     TEXT NOT NULL DEFAULT '',
  requirements    TEXT NOT NULL DEFAULT '',
  employment_type TEXT NOT NULL DEFAULT 'Full-Time',
  salary_range    TEXT NOT NULL DEFAULT '',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  posted_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closes_at       TIMESTAMP,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── Candidates ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS candidates (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(320) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  phone         TEXT NOT NULL DEFAULT '',
  phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  mobile_otp    TEXT,
  mobile_otp_expiry TIMESTAMP,
  is_blocked    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── Job Applications ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS job_applications (
  id                    SERIAL PRIMARY KEY,
  application_number    VARCHAR(50) NOT NULL UNIQUE,
  job_id                INT REFERENCES careers(id),
  candidate_id          INT REFERENCES candidates(id),
  status                TEXT NOT NULL DEFAULT 'submitted',
  resume_url            TEXT DEFAULT '',
  cover_letter          TEXT NOT NULL DEFAULT '',
  current_employer      TEXT NOT NULL DEFAULT '',
  years_experience      TEXT NOT NULL DEFAULT '',
  highest_qualification TEXT NOT NULL DEFAULT '',
  specialisations       JSONB NOT NULL DEFAULT '[]',
  linkedin_url          TEXT NOT NULL DEFAULT '',
  notice_period         TEXT NOT NULL DEFAULT '',
  expected_salary       TEXT NOT NULL DEFAULT '',
  admin_notes           TEXT NOT NULL DEFAULT '',
  submitted_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── Interview Slots ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS interview_slots (
  id               SERIAL PRIMARY KEY,
  application_id   INT REFERENCES job_applications(id),
  date             TEXT NOT NULL,
  time_slot        TEXT NOT NULL,
  duration         INT NOT NULL DEFAULT 60,
  interviewer_name TEXT NOT NULL DEFAULT '',
  location         TEXT NOT NULL DEFAULT '',
  meeting_link     TEXT NOT NULL DEFAULT '',
  status           TEXT NOT NULL DEFAULT 'scheduled',
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── Interview Availability ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS interview_availability (
  id                    SERIAL PRIMARY KEY,
  date                  TEXT NOT NULL,
  time_slot             TEXT NOT NULL,
  duration              INT NOT NULL DEFAULT 45,
  interviewer_name      TEXT NOT NULL DEFAULT '',
  location              TEXT NOT NULL DEFAULT '',
  meeting_link          TEXT NOT NULL DEFAULT '',
  notes                 TEXT NOT NULL DEFAULT '',
  is_booked             BOOLEAN NOT NULL DEFAULT FALSE,
  booked_application_id INT,
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── Interview Custom Requests ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS interview_custom_requests (
  id                  SERIAL PRIMARY KEY,
  application_id      INT NOT NULL REFERENCES job_applications(id),
  candidate_id        INT NOT NULL,
  preferred_date      TEXT NOT NULL,
  preferred_time_slot TEXT NOT NULL,
  notes               TEXT NOT NULL DEFAULT '',
  status              TEXT NOT NULL DEFAULT 'pending',
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── Notify Subscribers (Articles & Events) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS articles_notify (
  id                SERIAL PRIMARY KEY,
  email             VARCHAR(255) NOT NULL,
  status            VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  unsubscribe_token VARCHAR(64) UNIQUE
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_articles_notify_email ON articles_notify (LOWER(email));

CREATE TABLE IF NOT EXISTS events_notify (
  id                SERIAL PRIMARY KEY,
  email             VARCHAR(255) NOT NULL,
  status            VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  unsubscribe_token VARCHAR(64) UNIQUE
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_events_notify_email ON events_notify (LOWER(email));

-- Legacy combined table (optional migration source)
CREATE TABLE IF NOT EXISTS notify_subscribers (
  id                SERIAL PRIMARY KEY,
  email             VARCHAR(320) NOT NULL,
  type              VARCHAR(20) NOT NULL CHECK (type IN ('article', 'event')),
  status            VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
  unsubscribe_token VARCHAR(64) NOT NULL UNIQUE,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_notify_email_type UNIQUE (email, type)
);

CREATE TABLE IF NOT EXISTS mail_logs (
  id            SERIAL PRIMARY KEY,
  subscriber_id INT,
  email         VARCHAR(320) NOT NULL,
  type          VARCHAR(20) NOT NULL CHECK (type IN ('article', 'event')),
  reference_id  INT NOT NULL,
  status        VARCHAR(20) NOT NULL DEFAULT 'sent',
  sent_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_mail_log UNIQUE (email, type, reference_id)
);

-- ─── Event Subscribers (legacy — migrated to notify_subscribers) ─────────────
CREATE TABLE IF NOT EXISTS event_subscribers (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(320) NOT NULL UNIQUE,
  subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── Events ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id                   SERIAL PRIMARY KEY,
  title                TEXT NOT NULL,
  description          TEXT NOT NULL DEFAULT '',
  photo_urls           JSONB NOT NULL DEFAULT '[]',
  event_date           TIMESTAMP,
  location             TEXT DEFAULT '',
  registration_url     TEXT DEFAULT '',
  show_donation_button BOOLEAN NOT NULL DEFAULT FALSE,
  is_published         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── Appointments ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
  id                    SERIAL PRIMARY KEY,
  nric_fin_number       VARCHAR(100) NOT NULL,
  name                  VARCHAR(150) NOT NULL,
  age                   INT NOT NULL,
  gender                VARCHAR(20) NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
  nationality           VARCHAR(100) NOT NULL,
  email                 VARCHAR(150) NOT NULL,
  phone                 VARCHAR(20) NOT NULL,
  counselling_type      VARCHAR(150) NOT NULL,
  sub_counselling_types TEXT,
  description           TEXT,
  remarks               TEXT,
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── Counselling Types ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS counselling_types (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS counselling_sub_types (
  id                  SERIAL PRIMARY KEY,
  counselling_type_id INT NOT NULL REFERENCES counselling_types(id) ON DELETE CASCADE,
  name                VARCHAR(255) NOT NULL,
  description         TEXT,
  heading             VARCHAR(500),
  image_url           TEXT,
  team_member_ids     TEXT,
  is_active           BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_counselling_sub_type_name UNIQUE (counselling_type_id, name)
);

-- ─── Volunteer Applications ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS volunteer_applications (
  id                  SERIAL PRIMARY KEY,
  title               VARCHAR(10) NOT NULL,
  name                VARCHAR(150) NOT NULL,
  nric_passport_last4 VARCHAR(4) NOT NULL,
  citizenship         VARCHAR(100) NOT NULL,
  dob                 DATE NOT NULL,
  age                 INT NOT NULL,
  gender              VARCHAR(20) NOT NULL,
  marital_status      VARCHAR(20) NOT NULL,
  ethnicity           VARCHAR(100),
  religion            VARCHAR(100),
  occupation          VARCHAR(150),
  address             TEXT NOT NULL,
  phone_hp            VARCHAR(20) NOT NULL,
  phone_res           VARCHAR(20),
  email               VARCHAR(150) NOT NULL,
  interest_areas      TEXT,
  other_contribution  TEXT,
  skills_hobbies      TEXT,
  preferred_days      TEXT NOT NULL,
  time_from           VARCHAR(10) DEFAULT '09:00',
  time_to             VARCHAR(10) DEFAULT '17:00',
  commitment_duration INT NOT NULL,
  commitment_unit     VARCHAR(20) NOT NULL DEFAULT 'Months',
  signature           VARCHAR(150) NOT NULL,
  declaration_checked BOOLEAN NOT NULL DEFAULT TRUE,
  status              VARCHAR(20) NOT NULL DEFAULT 'pending',
  admin_notes         TEXT,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Article multi-language support
CREATE TABLE IF NOT EXISTS languages (
  id   SERIAL PRIMARY KEY,
  code VARCHAR(10) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS documents (
  id            SERIAL PRIMARY KEY,
  original_name TEXT NOT NULL DEFAULT '',
  file_name     TEXT,
  file_path     TEXT,
  mime_type     TEXT,
  html_content  TEXT NOT NULL DEFAULT '',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS article_language (
  id          SERIAL PRIMARY KEY,
  article_id  INT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  language_id INT NOT NULL REFERENCES languages(id) ON DELETE RESTRICT,
  document_id INT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_article_language UNIQUE (article_id, language_id)
);

-- Anonymous live visitors tracking
CREATE TABLE IF NOT EXISTS visitors (
  id          SERIAL PRIMARY KEY,
  visitor_id  VARCHAR(100) NOT NULL UNIQUE,
  last_seen   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_visitors_last_seen ON visitors (last_seen);

