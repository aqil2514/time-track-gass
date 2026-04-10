CREATE OR REPLACE FUNCTION get_user_allowed_categories(target_user_id UUID)
RETURNS text[] 
LANGUAGE plpgsql
AS $$
DECLARE
    categories_result text[];
BEGIN
    SELECT 
        ARRAY(
            SELECT jsonb_array_elements_text(d.vision_config -> 'allowed_categories')
        ) INTO categories_result
    FROM divisions d
    JOIN profiles p ON p.division_id = d.id
    WHERE p.id = target_user_id;

    RETURN categories_result;
END;
$$;