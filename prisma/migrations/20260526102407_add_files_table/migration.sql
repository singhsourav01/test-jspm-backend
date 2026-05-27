-- CreateTable
CREATE TABLE `files` (
    `id` VARCHAR(191) NOT NULL,
    `file_upload_type` VARCHAR(191) NOT NULL,
    `file_is_delete` BOOLEAN NOT NULL DEFAULT false,
    `file_media_type` VARCHAR(191) NOT NULL,
    `file_url` TEXT NOT NULL,
    `file_thumbnail_url` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `files_file_upload_type_idx`(`file_upload_type`),
    INDEX `files_file_is_delete_idx`(`file_is_delete`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
