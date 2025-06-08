-- Migration: 20250603172208_add_variety_in_order
-- This migration was applied directly to the database
-- Recreating for migration history consistency

-- Add variety column to orders table
ALTER TABLE "orders" ADD COLUMN "variety" TEXT NOT NULL DEFAULT 'NORMAL'; 