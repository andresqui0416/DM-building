-- Drop default from unit column to make it required with no default
ALTER TABLE `materials` MODIFY `unit` VARCHAR(64) NOT NULL;

