-- Migration 007: Add admin_users table for user management & section assignment
CREATE TABLE IF NOT EXISTS admin_users (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(320) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          VARCHAR(100) NOT NULL DEFAULT 'counsellor',
  sections      JSONB NOT NULL DEFAULT '[]',
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP
);
