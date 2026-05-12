-- Inflate user rank for FOMO
CREATE OR REPLACE FUNCTION get_user_rank(p_referral_code text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rank integer;
  v_base integer := 10000;
BEGIN
  -- Her kayıt için 5-10 arası deterministik (id bazlı) bir artış hesapla
  -- Ve bu artışların kümülatif toplamını al
  SELECT calculated_rank INTO v_rank
  FROM (
    SELECT 
      referral_code, 
      SUM(increment_val) OVER (ORDER BY (created_at - (referral_count * interval '12 hours')) ASC) as calculated_rank
    FROM (
      SELECT 
        referral_code, 
        created_at,
        referral_count,
        (abs(hashtext(id::text)) % 6 + 5) as increment_val
      FROM "Viwra_Waitlist"
    ) raw_data
  ) ranked
  WHERE referral_code = p_referral_code;
  
  IF v_rank IS NOT NULL THEN
    RETURN v_rank + v_base;
  ELSE
    RETURN NULL;
  END IF;
END;
$$;
