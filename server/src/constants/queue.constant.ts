export const QUERY_NAME = {
    SUMMARY_SESSION: process.env.BULL_SUMMARY_SESSION || 'summary-session',
    DAILY_SUMMARY: process.env.BULL_DAILY_SUMMARY_QUEUE || 'daily-summary-queue',
    DAILY_CATEGORY: process.env.BULL_DAILY_CATEGORY_SUMMARY_QUEUE || 'daily-category-summary-queue',
    MANUAL_ANALYZE: process.env.BULL_MANUAL_UPLOAD_QUEUE || 'manual-upload-queue',
}