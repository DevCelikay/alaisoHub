-- =====================================================
-- Migration: Add key_name to instantly_credentials
-- Adds optional name field to help identify API keys
-- =====================================================

-- Add key_name column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'instantly_credentials'
    AND column_name = 'key_name'
  ) THEN
    ALTER TABLE public.instantly_credentials
    ADD COLUMN key_name TEXT;
  END IF;
END $$;

-- Verify column was added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'instantly_credentials'
  AND column_name = 'key_name';
