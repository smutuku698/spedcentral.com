-- Migration: adds key_features to a products table that already exists
-- (schema.sql is now updated to include it inline for any future fresh
-- install). Run once in the SQL Editor.
alter table products add column if not exists key_features text[] not null default '{}';
