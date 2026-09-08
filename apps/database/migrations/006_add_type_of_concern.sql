-- Add type_of_concern and type_of_concern_other columns to appointments table
ALTER TABLE appointments
ADD COLUMN type_of_concern VARCHAR(100),
ADD COLUMN type_of_concern_other TEXT;
