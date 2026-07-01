-- Add unique constraint to prevent duplicate clones per user per store
CREATE UNIQUE INDEX "store_clones_storeId_clonedByUserId_key" ON "store_clones"("storeId", "clonedByUserId");
