-- AlterTable
ALTER TABLE `chat_messages` MODIFY `attachments` LONGTEXT NULL;

-- AlterTable
ALTER TABLE `materials` MODIFY `unit` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `order_updates` MODIFY `images` LONGTEXT NULL;

-- AlterTable
ALTER TABLE `projects` MODIFY `structure_json` LONGTEXT NOT NULL;

-- AddForeignKey
ALTER TABLE `material_categories` ADD CONSTRAINT `material_categories_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `material_categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `quotation_materials` RENAME INDEX `quotation_materials_material_id_fkey` TO `quotation_materials_material_id_idx`;
