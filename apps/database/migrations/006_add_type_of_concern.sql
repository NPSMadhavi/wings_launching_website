-- Migration 006: Add type_of_concern and extended appointment fields
-- Safe and idempotent: Uses ADD COLUMN IF NOT EXISTS for PostgreSQL

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS type_of_concern VARCHAR(100),
  ADD COLUMN IF NOT EXISTS type_of_concern_other TEXT,
  ADD COLUMN IF NOT EXISTS enquirer_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS enquirer_name VARCHAR(150),
  ADD COLUMN IF NOT EXISTS enquirer_relationship VARCHAR(100),
  ADD COLUMN IF NOT EXISTS enquirer_contact_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS enquirer_email VARCHAR(150),
  ADD COLUMN IF NOT EXISTS referral_agency_name VARCHAR(150),
  ADD COLUMN IF NOT EXISTS referral_agency_contact_person VARCHAR(150),
  ADD COLUMN IF NOT EXISTS referral_agency_contact_email VARCHAR(150),
  ADD COLUMN IF NOT EXISTS referral_agency_password TEXT,
  ADD COLUMN IF NOT EXISTS attachments_json TEXT,
  ADD COLUMN IF NOT EXISTS sub_counselling_types TEXT;
