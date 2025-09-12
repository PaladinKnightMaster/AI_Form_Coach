-- Add category column to foods table
ALTER TABLE public.foods ADD COLUMN IF NOT EXISTS category text;

-- Add comment for documentation
COMMENT ON COLUMN public.foods.category IS 'Food category (fruits, vegetables, protein, dairy, grains, snacks, beverages, etc.)';
