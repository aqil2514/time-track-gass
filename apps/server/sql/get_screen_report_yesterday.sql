CREATE OR REPLACE FUNCTION get_screen_report_yesterday()
RETURNS TABLE (
  user_id UUID,
  date DATE,
  count BIGINT,
  total_work_time NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    asr.user_id,
    DATE(asr.created_at AT TIME ZONE 'Asia/Jakarta') AS date,
    COUNT(*) AS count,
    SUM(asr."interval") AS total_work_time
  FROM ai_screen_report asr
  WHERE 
    DATE(asr.created_at AT TIME ZONE 'Asia/Jakarta') = (NOW() AT TIME ZONE 'Asia/Jakarta')::DATE - 1
    AND asr.category <> 'unclassified'
  GROUP BY asr.user_id, DATE(asr.created_at AT TIME ZONE 'Asia/Jakarta');
END;
$$ LANGUAGE plpgsql;