-- Arreglo urgente para solucionar errores de UUID en orders

-- 1. Asegurar que la columna 'id' tenga default UUID
ALTER TABLE orders 
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 2. Asegurar que p2p_reference sea TEXT (no UUID)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' 
      AND column_name = 'p2p_reference' 
      AND data_type = 'uuid'
  ) THEN
    ALTER TABLE orders 
      ALTER COLUMN p2p_reference TYPE TEXT USING p2p_reference::TEXT;
  END IF;
END $$;

-- 3. Asegurar que payment_reference sea TEXT (no UUID)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' 
      AND column_name = 'payment_reference' 
      AND data_type = 'uuid'
  ) THEN
    ALTER TABLE orders 
      ALTER COLUMN payment_reference TYPE TEXT USING payment_reference::TEXT;
  END IF;
END $$;

-- 4. Asegurar que payment_id sea TEXT (no UUID) porque Square puede devolver IDs no-UUID
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' 
      AND column_name = 'payment_id' 
      AND data_type = 'uuid'
  ) THEN
    ALTER TABLE orders 
      ALTER COLUMN payment_id TYPE TEXT USING payment_id::TEXT;
  END IF;
END $$;

-- 5. Asegurar que user_id sea UUID nullable
ALTER TABLE orders 
  ALTER COLUMN user_id TYPE UUID USING 
    CASE 
      WHEN user_id IS NULL THEN NULL
      WHEN user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' 
      THEN user_id::UUID 
      ELSE NULL 
    END;

-- 6. Limpiar datos corruptos existentes
UPDATE orders 
SET 
  user_id = NULL 
WHERE user_id IS NOT NULL 
  AND user_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

-- 7. Verificar estructura final
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default 
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND table_schema = 'public'
  AND column_name IN ('id', 'user_id', 'payment_id', 'payment_reference', 'p2p_reference')
ORDER BY ordinal_position;
