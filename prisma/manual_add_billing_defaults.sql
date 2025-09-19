-- Safe, additive changes only: add JSONB columns if they don't exist
ALTER TABLE IF EXISTS public.ot_procedures
  ADD COLUMN IF NOT EXISTS billing_defaults JSONB NULL;

ALTER TABLE IF EXISTS public.imaging_procedures
  ADD COLUMN IF NOT EXISTS billing_defaults JSONB NULL;
