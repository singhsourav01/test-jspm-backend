/*
  Warnings:

  - The values [ABOUT_US,ACADEMICS,RESEARCH,ADMISSION] on the enum `cms_pages_category` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `cms_pages` MODIFY `category` ENUM('HOME', 'SCHOOL', 'NORMAL') NOT NULL DEFAULT 'NORMAL';
