-- Migration: 20250603182100_add_parent_order_id  
-- This migration was applied directly to the database
-- Recreating for migration history consistency

-- Add parent order ID and relationships
ALTER TABLE "orders" ADD COLUMN "parentOrderId" TEXT;
ALTER TABLE "orders" ADD CONSTRAINT "orders_parentOrderId_fkey" FOREIGN KEY ("parentOrderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE; 