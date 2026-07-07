-- Add quote_items, quote_notes, and contract_content to SpecialRequest
ALTER TABLE "SpecialRequest" ADD COLUMN IF NOT EXISTS "quote_items" JSONB;
ALTER TABLE "SpecialRequest" ADD COLUMN IF NOT EXISTS "quote_notes" TEXT;
ALTER TABLE "SpecialRequest" ADD COLUMN IF NOT EXISTS "contract_content" TEXT;
