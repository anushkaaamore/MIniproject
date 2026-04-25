CREATE TABLE IF NOT EXISTS test_sessions (
  id SERIAL PRIMARY KEY,
  test_id VARCHAR(100) UNIQUE NOT NULL,
  test_name VARCHAR(255) NOT NULL,
  mode VARCHAR(20) NOT NULL CHECK (mode IN ('whitelist', 'blacklist')),
  whitelist_domains TEXT[] DEFAULT ARRAY[]::TEXT[],
  blacklist_domains TEXT[] DEFAULT ARRAY[]::TEXT[],
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS devices (
  id SERIAL PRIMARY KEY,
  student_id VARCHAR(100) NOT NULL,
  student_name VARCHAR(255) NOT NULL,
  mac_address VARCHAR(50) UNIQUE NOT NULL,
  ip_address VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY,
  test_session_id INTEGER NOT NULL REFERENCES test_sessions(id) ON DELETE CASCADE,
  ip_address VARCHAR(50) NOT NULL,
  mac_address VARCHAR(50) NOT NULL,
  domain_accessed VARCHAR(255),
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('UNAUTHORIZED_DOMAIN', 'BLACKLISTED_DOMAIN', 'TRAFFIC_ANOMALY', 'UNAUTHORIZED_DEVICE')),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('critical', 'high', 'medium')),
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_test_session_id ON alerts(test_session_id);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at);
