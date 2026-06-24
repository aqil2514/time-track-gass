-- DropIndex
DROP INDEX "idx_unique_name_not_deleted";

-- AlterTable
ALTER TABLE "ai_screen_report" ADD COLUMN     "image_hash" TEXT;
