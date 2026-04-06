CREATE OR REPLACE FUNCTION get_weekly_user_activity_by_date(client_date TIMESTAMPTZ)
RETURNS TABLE (
    user_id UUID,
    total_activity BIGINT
) 
LANGUAGE plpgsql
AS $$
DECLARE
    start_of_week TIMESTAMPTZ;
BEGIN
    -- Eksplisit gunakan timezone WIB
    start_of_week := DATE_TRUNC('week', client_date AT TIME ZONE 'Asia/Jakarta') 
                     AT TIME ZONE 'Asia/Jakarta';

    RETURN QUERY
    SELECT 
        report.user_id,
        COUNT(*) as total_activity
    FROM 
        ai_screen_report report
    WHERE 
        report.created_at >= start_of_week
        AND report.created_at <= client_date
        AND category <> 'unclassified'
    GROUP BY 
        report.user_id;
END;
$$;