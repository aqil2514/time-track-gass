CREATE OR REPLACE FUNCTION get_screen_report_today()
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  username TEXT,
  division TEXT,
  date DATE,
  count BIGINT,
  total_work_time NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS user_id,
    p.full_name,
    p.username,
    p.division,
    DATE(asr.created_at AT TIME ZONE 'Asia/Jakarta') AS date,
    COUNT(*) AS count,
    SUM(asr."interval") AS total_work_time
  FROM ai_screen_report asr
  JOIN profiles p ON p.id = asr.user_id
  WHERE 
    DATE(asr.created_at AT TIME ZONE 'Asia/Jakarta') 
      = (NOW() AT TIME ZONE 'Asia/Jakarta')::DATE
    AND asr.category <> 'unclassified'
    AND p.deleted_at IS NULL
  GROUP BY p.id, p.full_name, p.username, p.division, DATE(asr.created_at AT TIME ZONE 'Asia/Jakarta');
END;
$$ LANGUAGE plpgsql;

SELECT * FROM get_screen_report_today();
