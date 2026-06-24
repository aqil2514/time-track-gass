-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "public"."activity_adjustment_lists" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT,
    "added_minutes" DECIMAL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "activity_adjustment_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."activity_adjustments" (
    "id" BIGSERIAL NOT NULL,
    "adjusment_id" BIGINT,
    "profile_id" UUID,
    "date" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "affected_minutes" DECIMAL,
    "s3_key" TEXT,

    CONSTRAINT "activity_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ai_screen_report" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "app_name" TEXT,
    "window_title" TEXT,
    "category" TEXT,
    "summary" TEXT,
    "user_id" UUID DEFAULT 'ad936a2a-5fc3-4270-975f-fb7e739866d4'::uuid,
    "s3_key" TEXT,
    "interval" DECIMAL DEFAULT 5,
    "deleted_at" TIMESTAMPTZ(6),
    "work_session_id" BIGINT,

    CONSTRAINT "ai_screen_report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."app_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "level" TEXT NOT NULL,
    "os" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "context" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."attendance_logs" (
    "id" BIGSERIAL NOT NULL,
    "profile_id" UUID,
    "work_date" DATE,
    "duration_minutes" DECIMAL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."daily_summary" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "date" TIMESTAMPTZ(6) NOT NULL,
    "summary" TEXT NOT NULL,
    "highlights" TEXT[],
    "productivity_description" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_summary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."daily_summary_per_categories" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" UUID,
    "category" TEXT,
    "duration" DECIMAL,
    "summary" TEXT,
    "date" DATE,

    CONSTRAINT "daily_summary_per_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."divisions" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT,
    "description" TEXT,
    "vision_config" JSONB DEFAULT '{"allowed_categories": [], "category_definitions": {}}',
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "divisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."profile_work_configs" (
    "id" BIGSERIAL NOT NULL,
    "profile_id" UUID,
    "min_hours_weekly" DECIMAL,
    "min_hours_monthly" DECIMAL,
    "penalty_per_hour" DECIMAL,
    "bonus_per_hour" DECIMAL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "penalty_type" TEXT,

    CONSTRAINT "proflie_work_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "full_name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "division" TEXT,
    "division_id" BIGINT,
    "settings" JSONB,
    "must_reset_password" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."session_summary" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "session_start" TIMESTAMPTZ(6) NOT NULL,
    "session_end" TIMESTAMPTZ(6) NOT NULL,
    "title" TEXT NOT NULL,
    "categories" TEXT NOT NULL,
    "raw_ids" TEXT[],
    "description" TEXT,

    CONSTRAINT "session_summary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."work_sessions" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" UUID,
    "start_at" TIMESTAMPTZ(6),
    "end_at" TIMESTAMPTZ(6),
    "stop_mode" TEXT,

    CONSTRAINT "work_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "activity_adjustment_lists_name_unique" ON "public"."activity_adjustment_lists"("name" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "idx_unique_name_not_deleted" ON "public"."activity_adjustment_lists"("name" ASC) WHERE (deleted_at IS NULL);

-- CreateIndex
CREATE UNIQUE INDEX "attendance_logs_profile_id_work_date_key" ON "public"."attendance_logs"("profile_id" ASC, "work_date" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "daily_summary_unique_user_date" ON "public"."daily_summary"("user_id" ASC, "date" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "session_summary_unique_user_session" ON "public"."session_summary"("user_id" ASC, "session_start" ASC, "categories" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "work_sessions_one_active_per_user" ON "public"."work_sessions"("user_id" ASC) WHERE (end_at IS NULL);

-- AddForeignKey
ALTER TABLE "public"."activity_adjustments" ADD CONSTRAINT "activity_adjustments_adjusment_id_fkey" FOREIGN KEY ("adjusment_id") REFERENCES "public"."activity_adjustment_lists"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."activity_adjustments" ADD CONSTRAINT "activity_adjustments_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."ai_screen_report" ADD CONSTRAINT "ai_screen_report_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."ai_screen_report" ADD CONSTRAINT "ai_screen_report_work_session_id_fkey" FOREIGN KEY ("work_session_id") REFERENCES "public"."work_sessions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."app_logs" ADD CONSTRAINT "app_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."attendance_logs" ADD CONSTRAINT "attendance_logs_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."daily_summary" ADD CONSTRAINT "daily_summary_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."daily_summary_per_categories" ADD CONSTRAINT "daily_summary_per_categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."profile_work_configs" ADD CONSTRAINT "proflie_work_configs_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."profiles" ADD CONSTRAINT "profiles_division_id_fkey" FOREIGN KEY ("division_id") REFERENCES "public"."divisions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."session_summary" ADD CONSTRAINT "session_summary_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."work_sessions" ADD CONSTRAINT "work_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

