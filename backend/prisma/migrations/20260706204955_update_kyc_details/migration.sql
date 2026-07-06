/*
  Warnings:

  - Added the required column `guarantor_city` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `guarantor_district` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `guarantor_email` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `guarantor_house` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `guarantor_ifu` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `guarantor_phone` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `guarantor_square` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `manager_city` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `manager_district` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `manager_email` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `manager_house` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `manager_ifu` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `manager_phone` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `manager_square` to the `Company` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `company` ADD COLUMN `guarantor_city` VARCHAR(191) NOT NULL,
    ADD COLUMN `guarantor_district` VARCHAR(191) NOT NULL,
    ADD COLUMN `guarantor_email` VARCHAR(191) NOT NULL,
    ADD COLUMN `guarantor_house` VARCHAR(191) NOT NULL,
    ADD COLUMN `guarantor_ifu` VARCHAR(191) NOT NULL,
    ADD COLUMN `guarantor_phone` VARCHAR(191) NOT NULL,
    ADD COLUMN `guarantor_rccm` VARCHAR(191) NULL,
    ADD COLUMN `guarantor_square` VARCHAR(191) NOT NULL,
    ADD COLUMN `manager_city` VARCHAR(191) NOT NULL,
    ADD COLUMN `manager_district` VARCHAR(191) NOT NULL,
    ADD COLUMN `manager_email` VARCHAR(191) NOT NULL,
    ADD COLUMN `manager_house` VARCHAR(191) NOT NULL,
    ADD COLUMN `manager_ifu` VARCHAR(191) NOT NULL,
    ADD COLUMN `manager_phone` VARCHAR(191) NOT NULL,
    ADD COLUMN `manager_rccm` VARCHAR(191) NULL,
    ADD COLUMN `manager_square` VARCHAR(191) NOT NULL;
