-- Add metadata column to notifications table to support scrim requests interactive actions
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata JSONB;
