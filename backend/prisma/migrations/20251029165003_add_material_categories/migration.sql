-- Create material_categories table
CREATE TABLE `material_categories` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `parent_id` VARCHAR(191) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `material_categories_slug_key`(`slug`),
    INDEX `material_categories_parent_id_idx`(`parent_id`),
    INDEX `material_categories_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Add category_id column to materials (nullable first)
ALTER TABLE `materials` ADD COLUMN `category_id` VARCHAR(191) NULL;

-- Create default categories from existing material categories
-- Create temporary mapping table
CREATE TEMPORARY TABLE temp_category_mapping (
    old_category VARCHAR(191) COLLATE utf8mb4_unicode_ci,
    new_id VARCHAR(191),
    new_name VARCHAR(191),
    new_slug VARCHAR(191),
    PRIMARY KEY (old_category)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Generate IDs and insert into temp table
-- Using MD5 hash to generate deterministic UUIDs (MySQL/MariaDB compatible)
INSERT INTO temp_category_mapping (old_category, new_id, new_name, new_slug)
SELECT DISTINCT 
    category,
    LOWER(CONCAT(
        LEFT(MD5(CONCAT('category-', category)), 8),
        '-',
        SUBSTRING(MD5(CONCAT('category-', category)), 9, 4),
        '-',
        '4000',
        '-',
        SUBSTRING(MD5(CONCAT('category-', category)), 17, 4),
        '-',
        SUBSTRING(MD5(CONCAT('category-', category)), 21, 12)
    )) as new_id,
    CONCAT(UPPER(LEFT(category, 1)), SUBSTRING(category, 2)) as new_name,
    category as new_slug
FROM materials 
WHERE category IS NOT NULL;

-- Insert categories
INSERT INTO `material_categories` (`id`, `name`, `slug`, `parent_id`, `sort_order`, `is_active`, `created_at`, `updated_at`)
SELECT 
    new_id,
    new_name,
    new_slug,
    NULL as parent_id,
    0 as sort_order,
    true as is_active,
    NOW() as created_at,
    NOW() as updated_at
FROM temp_category_mapping;

-- Update materials to set category_id based on category slug
UPDATE `materials` m
JOIN `temp_category_mapping` tcm ON m.category COLLATE utf8mb4_unicode_ci = tcm.old_category
SET m.category_id = tcm.new_id
WHERE m.category IS NOT NULL;

-- Drop temp table
DROP TEMPORARY TABLE temp_category_mapping;

-- Make category_id NOT NULL
ALTER TABLE `materials` MODIFY COLUMN `category_id` VARCHAR(191) NOT NULL;

-- Add foreign key constraint
ALTER TABLE `materials` ADD CONSTRAINT `materials_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `material_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add index
CREATE INDEX `materials_category_id_idx` ON `materials`(`category_id`);

-- Drop the old category column
ALTER TABLE `materials` DROP COLUMN `category`;

-- Drop the old category index if it exists
-- ALTER TABLE `materials` DROP INDEX `materials_category_idx`; -- Will be handled by Prisma if needed

