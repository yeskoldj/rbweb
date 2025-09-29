-- Ensure quotes table has cart snapshot and reference columns
DO $$
BEGIN
  IF to_regclass('public.quotes') IS NULL THEN
    RETURN;
  END IF;

  ALTER TABLE public.quotes
    ADD COLUMN IF NOT EXISTS cart_items jsonb;

  ALTER TABLE public.quotes
    ALTER COLUMN cart_items SET DEFAULT '[]'::jsonb;

  UPDATE public.quotes
    SET cart_items = '[]'::jsonb
  WHERE cart_items IS NULL;

  BEGIN
    ALTER TABLE public.quotes
      ALTER COLUMN cart_items SET NOT NULL;
  EXCEPTION
    WHEN undefined_column THEN
      -- Column might not exist in extremely old snapshots; ignore and continue.
      NULL;
  END;

  ALTER TABLE public.quotes
    ADD COLUMN IF NOT EXISTS reference_code text;

  CREATE UNIQUE INDEX IF NOT EXISTS quotes_reference_code_key
    ON public.quotes (reference_code)
    WHERE reference_code IS NOT NULL;

  PERFORM pg_notify('pgrst', 'reload schema');
END;
$$;
