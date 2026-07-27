-- Migration: adds the two columns above to a products table that was
-- already created from an earlier version of schema.sql (which is now
-- updated to include these inline for any future fresh install). Run this
-- once in the SQL Editor if `products` already exists in your project;
-- skip it entirely on a brand-new project since schema.sql already has it.
alter table products add column if not exists image_icon text;
alter table products add column if not exists image_tint text;
