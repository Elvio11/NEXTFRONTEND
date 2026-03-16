-- ─────────────────────────────────────────────────────────────
-- Agent 14 RPC: Get applications due for email follow-up
-- Returns applications where a follow-up email is due to send
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_eligible_followups(p_user_id UUID)
RETURNS TABLE (
  id                    UUID,
  job_id                UUID,
  applied_at            TIMESTAMPTZ,
  fu_email_1_sent_at    TIMESTAMPTZ,
  fu_email_2_sent_at    TIMESTAMPTZ,
  fu_close_loop_sent_at TIMESTAMPTZ,
  fu_stopped            BOOLEAN,
  fit_score_at_apply    SMALLINT,
  tailored_resume_path  TEXT,
  job_title             TEXT,
  company_canonical     TEXT,
  company_domain        TEXT,
  recruiter_email       TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ja.id,
    ja.job_id,
    ja.applied_at,
    ja.fu_email_1_sent_at,
    ja.fu_email_2_sent_at,
    ja.fu_close_loop_sent_at,
    ja.fu_stopped,
    ja.fit_score_at_apply,
    ja.tailored_resume_path,
    j.title        AS job_title,
    j.company_canonical,
    j.company_domain,
    j.recruiter_email
  FROM job_applications ja
  JOIN jobs j ON j.id = ja.job_id
  WHERE ja.user_id = p_user_id
    AND ja.fu_stopped = FALSE
    AND ja.status NOT IN ('rejected', 'withdrawn', 'ghosted')
    AND (
      (ja.fu_email_1_sent_at IS NULL
        AND ja.applied_at < NOW() - INTERVAL '7 days')
      OR
      (ja.fu_email_2_sent_at IS NULL
        AND ja.fu_email_1_sent_at IS NOT NULL
        AND ja.fu_email_1_sent_at < NOW() - INTERVAL '7 days')
      OR
      (ja.fu_close_loop_sent_at IS NULL
        AND ja.fu_email_2_sent_at IS NOT NULL
        AND ja.fu_email_2_sent_at < NOW() - INTERVAL '7 days')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────
-- Agent 14 RPC: Get applications due for LinkedIn outreach
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_eligible_linkedin_tasks(p_user_id UUID)
RETURNS TABLE (
  id                     UUID,
  user_id                UUID,
  job_id                 UUID,
  applied_at             TIMESTAMPTZ,
  li_connection_status   TEXT,
  li_connection_sent_at  TIMESTAMPTZ,
  li_recruiter_url       TEXT,
  li_message_sent_at     TIMESTAMPTZ,
  fit_score_at_apply     SMALLINT,
  tailored_resume_path   TEXT,
  job_title              TEXT,
  company_canonical      TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ja.id,
    ja.user_id,
    ja.job_id,
    ja.applied_at,
    ja.li_connection_status,
    ja.li_connection_sent_at,
    ja.li_recruiter_url,
    ja.li_message_sent_at,
    ja.fit_score_at_apply,
    ja.tailored_resume_path,
    j.title          AS job_title,
    j.company_canonical
  FROM job_applications ja
  JOIN jobs j ON j.id = ja.job_id
  WHERE ja.user_id = p_user_id
    AND ja.status NOT IN ('rejected', 'withdrawn', 'ghosted')
    AND (
      -- Phase A: Day 2, no connection sent yet
      (ja.li_connection_status = 'not_sent'
        AND ja.applied_at < NOW() - INTERVAL '2 days')
      OR
      -- Phase B: Connection accepted, no message sent
      (ja.li_connection_status = 'accepted'
        AND ja.li_message_sent_at IS NULL)
      OR
      -- Phase C: Pending for 5+ days → withdraw
      (ja.li_connection_status = 'pending'
        AND ja.li_connection_sent_at < NOW() - INTERVAL '5 days')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────
-- Agent 14 RPC: Atomic LinkedIn action counter increment
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_linkedin_action(
  p_user_id UUID,
  p_date    DATE,
  p_action  TEXT
) RETURNS void AS $$
BEGIN
  INSERT INTO linkedin_daily_limits (user_id, limit_date)
  VALUES (p_user_id, p_date)
  ON CONFLICT (user_id, limit_date) DO NOTHING;

  EXECUTE format(
    'UPDATE linkedin_daily_limits SET %I = %I + 1
     WHERE user_id = $1 AND limit_date = $2',
    p_action, p_action
  ) USING p_user_id, p_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────
-- Agent 14 RPC: 7-day rolling LinkedIn acceptance rate
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION calculate_li_acceptance_rate(p_user_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_total    INT;
  v_accepted INT;
BEGIN
  SELECT COUNT(*) INTO v_total
  FROM job_applications
  WHERE user_id = p_user_id
    AND li_connection_sent_at > NOW() - INTERVAL '7 days'
    AND li_connection_status IN ('accepted', 'declined', 'withdrawn');

  SELECT COUNT(*) INTO v_accepted
  FROM job_applications
  WHERE user_id = p_user_id
    AND li_connection_sent_at > NOW() - INTERVAL '7 days'
    AND li_connection_status = 'accepted';

  IF v_total = 0 THEN RETURN 1.0; END IF;
  RETURN v_accepted::NUMERIC / v_total::NUMERIC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────
-- Also add recruiter_email column to jobs if missing
-- ─────────────────────────────────────────────────────────────
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS recruiter_email TEXT;
