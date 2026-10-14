CREATE TABLE render_leads (
  id uuid PRIMARY KEY,
  request_key uuid NOT NULL UNIQUE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  company text NOT NULL DEFAULT '' CHECK (char_length(company) <= 120),
  phone text NOT NULL DEFAULT '' CHECK (char_length(phone) <= 40),
  email text NOT NULL DEFAULT '' CHECK (char_length(email) <= 254),
  contact_method text NOT NULL CHECK (contact_method IN ('phone','email','whatsapp')),
  services jsonb NOT NULL DEFAULT '[]',
  brief text NOT NULL CHECK (char_length(brief) BETWEEN 10 AND 3000),
  language text NOT NULL DEFAULT 'en' CHECK (language IN ('en','ka')),
  status text NOT NULL DEFAULT 'unlisted' CHECK (status IN ('unlisted','hot','cold')),
  notes text NOT NULL DEFAULT '' CHECK (char_length(notes) <= 5000),
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX render_leads_created ON render_leads (created_at DESC, id DESC);
CREATE INDEX render_leads_status_created ON render_leads (status, created_at DESC);
CREATE TABLE render_admin_sessions (
  token_hash text PRIMARY KEY,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX render_sessions_expiry ON render_admin_sessions (expires_at);
CREATE TABLE render_rate_limits (
  bucket text PRIMARY KEY,
  attempts integer NOT NULL DEFAULT 1,
  expires_at timestamptz NOT NULL
);
CREATE INDEX render_rate_expiry ON render_rate_limits (expires_at);
