-- CreateTable
CREATE TABLE `page_content_blocks` (
    `id` VARCHAR(191) NOT NULL,
    `page_id` VARCHAR(191) NOT NULL,
    `block_type` ENUM('TITLE', 'PARAGRAPH', 'RICH_TEXT', 'SINGLE_FILE', 'GRID_TITLE', 'MULTIPLE_IMAGE_GRID') NOT NULL,
    `title` TEXT NULL,
    `content` LONGTEXT NULL,
    `file_url` TEXT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_published` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `page_content_blocks_page_id_idx`(`page_id`),
    INDEX `page_content_blocks_block_type_idx`(`block_type`),
    INDEX `page_content_blocks_sort_order_idx`(`sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `grid_items` (
    `id` VARCHAR(191) NOT NULL,
    `block_id` VARCHAR(191) NOT NULL,
    `image_name` VARCHAR(191) NULL,
    `image_url` TEXT NULL,
    `designation_name` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `grid_items_block_id_idx`(`block_id`),
    INDEX `grid_items_sort_order_idx`(`sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `multiple_image_items` (
    `id` VARCHAR(191) NOT NULL,
    `block_id` VARCHAR(191) NOT NULL,
    `image_name` VARCHAR(191) NULL,
    `image_url` TEXT NULL,
    `designation_name` VARCHAR(191) NULL,
    `button_label_1` VARCHAR(191) NULL,
    `button_link_1` TEXT NULL,
    `button_label_2` VARCHAR(191) NULL,
    `button_link_2` TEXT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `multiple_image_items_block_id_idx`(`block_id`),
    INDEX `multiple_image_items_sort_order_idx`(`sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `page_content_blocks` ADD CONSTRAINT `page_content_blocks_page_id_fkey` FOREIGN KEY (`page_id`) REFERENCES `cms_pages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `grid_items` ADD CONSTRAINT `grid_items_block_id_fkey` FOREIGN KEY (`block_id`) REFERENCES `page_content_blocks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `multiple_image_items` ADD CONSTRAINT `multiple_image_items_block_id_fkey` FOREIGN KEY (`block_id`) REFERENCES `page_content_blocks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
