-- User usage tracking table
CREATE TABLE IF NOT EXISTS user_usage (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  message_count INTEGER DEFAULT 0,
  upload_count INTEGER DEFAULT 0,
  last_reset_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own usage" ON user_usage;
CREATE POLICY "Users can view their own usage"
  ON user_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can update usage
DROP POLICY IF EXISTS "Service role can manage usage" ON user_usage;
CREATE POLICY "Service role can manage usage"
  ON user_usage FOR ALL
  USING (true)
  WITH CHECK (true);
