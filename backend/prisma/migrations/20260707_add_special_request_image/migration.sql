-- Add image_url to SpecialRequest and category to Product (if not already added)
ALTER TABLE "SpecialRequest" ADD COLUMN IF NOT EXISTS "image_url" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "category" TEXT;
