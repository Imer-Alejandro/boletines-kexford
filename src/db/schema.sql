-- Tabla customers
CREATE TABLE IF NOT EXISTS customers (
  id BIGSERIAL PRIMARY KEY,
  external_id VARCHAR(100),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(320) NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  subject VARCHAR(500) NOT NULL,
  image_url TEXT,
  image_public_id TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  daily_limit INTEGER DEFAULT 50,
  hourly_limit INTEGER DEFAULT 7,
  min_interval_seconds INTEGER DEFAULT 30,
  max_interval_seconds INTEGER DEFAULT 90,
  status VARCHAR(30) DEFAULT 'DRAFT',
  total_recipients INTEGER DEFAULT 0,
  total_sent INTEGER DEFAULT 0,
  total_failed INTEGER DEFAULT 0,
  total_pending INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla campaign_recipients
CREATE TABLE IF NOT EXISTS campaign_recipients (
  id BIGSERIAL PRIMARY KEY,
  campaign_id BIGINT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  customer_id BIGINT NOT NULL REFERENCES customers(id),
  email VARCHAR(320) NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(30) DEFAULT 'PENDING',
  attempts INTEGER DEFAULT 0,
  processing_at TIMESTAMPTZ NULL,
  sent_at TIMESTAMPTZ NULL,
  error_message TEXT NULL,
  last_attempt_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, customer_id)
);

CREATE INDEX IF NOT EXISTS idx_campaign_recipients_schedule ON campaign_recipients(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign ON campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_customer ON campaign_recipients(customer_id);
