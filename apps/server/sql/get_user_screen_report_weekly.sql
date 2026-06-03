CREATE OR REPLACE FUNCTION get_user_screen_report_weekly(
  p_user_id UUID,
  p_date DATE
)
RETURNS TABLE (
  user_id UUID,
  week_start DATE,
  week_end DATE,
  total_work_time_minutes NUMERIC
) AS $$
DECLARE
  v_start_of_week DATE;
  v_end_of_week DATE;
BEGIN
  v_start_of_week := date_trunc('week', p_date)::DATE;
  v_end_of_week := v_start_of_week + 6;

  RETURN QUERY
  SELECT
    asr.user_id,
    v_start_of_week AS week_start,
    v_end_of_week AS week_end,
    SUM(asr."interval") AS total_work_time_minutes
  FROM ai_screen_report asr
  WHERE 
    asr.user_id = p_user_id
    AND DATE(asr.created_at AT TIME ZONE 'Asia/Jakarta') BETWEEN v_start_of_week AND v_end_of_week
    AND asr.category <> 'unclassified'
  GROUP BY asr.user_id;
END;
$$ LANGUAGE plpgsql;