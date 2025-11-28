-- Fix numeric field overflow in offline_map_configs table
-- Change precision to allow larger values for estimated_size_mb

ALTER TABLE offline_map_configs 
ALTER COLUMN estimated_size_mb TYPE numeric(10,2);