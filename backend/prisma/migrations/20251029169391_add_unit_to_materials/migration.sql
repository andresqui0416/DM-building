-- Add unit column to materials with default 'unit'
ALTER TABLE `materials` ADD COLUMN `unit` VARCHAR(64) NOT NULL DEFAULT 'unit' AFTER `category_id`;

-- Optional: backfill existing rows explicitly (default already handles it)
UPDATE `materials` SET `unit` = COALESCE(`unit`, 'unit');

