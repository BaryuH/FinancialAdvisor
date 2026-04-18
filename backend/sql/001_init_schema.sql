-- =========================================================
-- PostgreSQL DDL for Financial Tracker V1
-- Assumption: run on a fresh database, for example: fainance_db
-- =========================================================

BEGIN;

-- =========================================================
-- 1) Extension
-- =========================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================================
-- 2) Enum types
-- =========================================================
CREATE TYPE category_flow_type AS ENUM ('income', 'expense');
CREATE TYPE transaction_type    AS ENUM ('income', 'expense');
CREATE TYPE transaction_source  AS ENUM ('manual', 'voice', 'ocr');
CREATE TYPE smart_input_mode    AS ENUM ('voice', 'ocr');
CREATE TYPE smart_input_status  AS ENUM ('processing', 'draft', 'confirmed', 'failed', 'discarded');

-- =========================================================
-- 3) Common trigger function for updated_at
-- =========================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- 4) Tables
-- =========================================================

-- 4.1 users
CREATE TABLE users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        VARCHAR(255) UNIQUE,
  display_name VARCHAR(120),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.2 categories
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NULL,
  name        VARCHAR(100) NOT NULL,
  slug        VARCHAR(100) NOT NULL,
  flow_type   category_flow_type NOT NULL,
  icon_key    VARCHAR(50) NOT NULL,
  color_hex   CHAR(7) NOT NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  is_system   BOOLEAN NOT NULL DEFAULT TRUE,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_categories_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

  CONSTRAINT uq_categories_user_slug_flow
    UNIQUE (user_id, slug, flow_type),

  CONSTRAINT chk_categories_color_hex
    CHECK (color_hex ~ '^#[0-9A-Fa-f]{6}$')
);

-- 4.3 budgets
CREATE TABLE budgets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL,
  category_id   UUID NOT NULL,
  budget_month  DATE NOT NULL,
  limit_minor   BIGINT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_budgets_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

  CONSTRAINT fk_budgets_category
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,

  CONSTRAINT uq_budgets_user_category_month
    UNIQUE (user_id, category_id, budget_month),

  CONSTRAINT chk_budgets_limit_positive
    CHECK (limit_minor > 0),

  CONSTRAINT chk_budgets_month_first_day
    CHECK (budget_month = date_trunc('month', budget_month)::date)
);

-- 4.4 goals
CREATE TABLE goals (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL,
  name           VARCHAR(150) NOT NULL,
  target_minor   BIGINT NOT NULL,
  current_minor  BIGINT NOT NULL DEFAULT 0,
  deadline       DATE NOT NULL,
  icon_key       VARCHAR(50) NOT NULL DEFAULT 'target',
  completed_at   TIMESTAMPTZ NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_goals_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

  CONSTRAINT chk_goals_target_positive
    CHECK (target_minor > 0),

  CONSTRAINT chk_goals_current_non_negative
    CHECK (current_minor >= 0),

  CONSTRAINT chk_goals_current_not_exceed_target
    CHECK (current_minor <= target_minor)
);

-- 4.5 smart_input_drafts
-- Lưu ý:
-- Chưa add FK confirmed_transaction_id ở đây vì transactions
-- sẽ được tạo ngay sau, để tránh vòng tham chiếu khi CREATE TABLE.
CREATE TABLE smart_input_drafts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL,
  mode                  smart_input_mode NOT NULL,
  status                smart_input_status NOT NULL,
  raw_text              TEXT NULL,
  source_file_ref       TEXT NULL,
  parsed_type           transaction_type NULL,
  parsed_amount_minor   BIGINT NULL,
  parsed_description    VARCHAR(255) NULL,
  suggested_category_id UUID NULL,
  merchant_name         VARCHAR(150) NULL,
  confidence_percent    SMALLINT NULL,
  parser_payload        JSONB NULL,
  confirmed_transaction_id UUID NULL,
  expires_at            TIMESTAMPTZ NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_drafts_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

  CONSTRAINT fk_drafts_suggested_category
    FOREIGN KEY (suggested_category_id) REFERENCES categories(id) ON DELETE SET NULL,

  CONSTRAINT chk_drafts_amount_positive
    CHECK (parsed_amount_minor IS NULL OR parsed_amount_minor > 0),

  CONSTRAINT chk_drafts_confidence_range
    CHECK (confidence_percent IS NULL OR confidence_percent BETWEEN 0 AND 100)
);

-- 4.6 transactions
CREATE TABLE transactions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL,
  category_id          UUID NOT NULL,
  type                 transaction_type NOT NULL,
  amount_minor         BIGINT NOT NULL,
  currency_code        CHAR(3) NOT NULL DEFAULT 'VND',
  description          VARCHAR(255) NOT NULL,
  transaction_date     DATE NOT NULL,
  source               transaction_source NOT NULL DEFAULT 'manual',
  smart_input_draft_id UUID NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_transactions_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

  CONSTRAINT fk_transactions_category
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,

  CONSTRAINT fk_transactions_draft
    FOREIGN KEY (smart_input_draft_id) REFERENCES smart_input_drafts(id) ON DELETE SET NULL,

  CONSTRAINT chk_transactions_amount_positive
    CHECK (amount_minor > 0),

  CONSTRAINT chk_transactions_description_not_blank
    CHECK (length(btrim(description)) > 0),

  CONSTRAINT chk_transactions_currency_code
    CHECK (currency_code ~ '^[A-Z]{3}$')
);

-- Sau khi transactions đã tồn tại, add FK ngược lại cho drafts
ALTER TABLE smart_input_drafts
  ADD CONSTRAINT fk_drafts_confirmed_transaction
  FOREIGN KEY (confirmed_transaction_id)
  REFERENCES transactions(id)
  ON DELETE SET NULL;

-- Optional: 1 draft chỉ confirm ra tối đa 1 transaction
ALTER TABLE smart_input_drafts
  ADD CONSTRAINT uq_drafts_confirmed_transaction
  UNIQUE (confirmed_transaction_id);

-- =========================================================
-- 5) Indexes
-- =========================================================

-- categories
CREATE INDEX idx_categories_flow_active
  ON categories(flow_type, is_active);

CREATE INDEX idx_categories_user_active
  ON categories(user_id, is_active);

-- budgets
CREATE INDEX idx_budgets_user_month
  ON budgets(user_id, budget_month);

CREATE INDEX idx_budgets_user_month_category
  ON budgets(user_id, budget_month, category_id);

-- goals
CREATE INDEX idx_goals_user_deadline
  ON goals(user_id, deadline);

CREATE INDEX idx_goals_user_completed_at
  ON goals(user_id, completed_at);

-- smart_input_drafts
CREATE INDEX idx_drafts_user_status_created_at
  ON smart_input_drafts(user_id, status, created_at DESC);

CREATE INDEX idx_drafts_user_mode_created_at
  ON smart_input_drafts(user_id, mode, created_at DESC);

-- transactions
CREATE INDEX idx_transactions_user_date
  ON transactions(user_id, transaction_date DESC);

CREATE INDEX idx_transactions_user_type_date
  ON transactions(user_id, type, transaction_date DESC);

CREATE INDEX idx_transactions_user_category_date
  ON transactions(user_id, category_id, transaction_date DESC);

-- Optional: search description nhanh hơn nếu sau này cần
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- CREATE INDEX idx_transactions_description_trgm
--   ON transactions USING gin (description gin_trgm_ops);

-- =========================================================
-- 6) updated_at triggers
-- =========================================================
CREATE TRIGGER trg_users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_categories_set_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_budgets_set_updated_at
BEFORE UPDATE ON budgets
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_goals_set_updated_at
BEFORE UPDATE ON goals
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_smart_input_drafts_set_updated_at
BEFORE UPDATE ON smart_input_drafts
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_transactions_set_updated_at
BEFORE UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

COMMIT;