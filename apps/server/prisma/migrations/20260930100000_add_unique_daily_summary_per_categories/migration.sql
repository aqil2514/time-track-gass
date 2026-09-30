-- CreateIndex
CREATE UNIQUE INDEX "daily_summary_per_categories_unique_user_date_category" ON "daily_summary_per_categories"("user_id", "date", "category");
