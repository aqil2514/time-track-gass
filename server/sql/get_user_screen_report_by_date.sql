CREATE OR REPLACE FUNCTION get_user_screen_report_by_date(
  p_user_id UUID,
  p_date DATE
)
RETURNS TABLE (
  user_id UUID,
  report_date DATE,
  total_count BIGINT,
  total_work_time_minutes NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    asr.user_id,
    DATE(asr.created_at) AS report_date,
    COUNT(*) AS total_count,
    SUM(asr."interval") AS total_work_time_minutes
  FROM ai_screen_report asr
  WHERE 
    asr.user_id = p_user_id
    AND DATE(asr.created_at) = p_date
    AND asr.category <> 'unclassified'
  GROUP BY asr.user_id, DATE(asr.created_at);
END;
$$ LANGUAGE plpgsql;