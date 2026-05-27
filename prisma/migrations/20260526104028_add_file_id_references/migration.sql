-- AlterTable
ALTER TABLE `grid_items` ADD COLUMN `file_id` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `multiple_image_items` ADD COLUMN `file_id` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `page_content_blocks` ADD COLUMN `file_id` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `grid_items_file_id_idx` ON `grid_items`(`file_id`);

-- CreateIndex
CREATE INDEX `multiple_image_items_file_id_idx` ON `multiple_image_items`(`file_id`);

-- CreateIndex
CREATE INDEX `page_content_blocks_file_id_idx` ON `page_content_blocks`(`file_id`);

-- AddForeignKey
ALTER TABLE `page_content_blocks` ADD CONSTRAINT `page_content_blocks_file_id_fkey` FOREIGN KEY (`file_id`) REFERENCES `files`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `grid_items` ADD CONSTRAINT `grid_items_file_id_fkey` FOREIGN KEY (`file_id`) REFERENCES `files`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `multiple_image_items` ADD CONSTRAINT `multiple_image_items_file_id_fkey` FOREIGN KEY (`file_id`) REFERENCES `files`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
