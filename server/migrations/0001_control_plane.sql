-- Malone Commerce Control V1: tenant-isolated operational control plane.
-- This migration creates no provider objects and stores no provider secrets.

CREATE TABLE IF NOT EXISTS schema_migrations (
  id text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenants (
  id text PRIMARY KEY,
  name text NOT NULL,
  currency char(3) NOT NULL,
  storefront_origin text NOT NULL,
  provider text NOT NULL CHECK (provider IN ('mock', 'shopify')),
  connection_state text NOT NULL CHECK (connection_state IN ('disconnected', 'connected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id text PRIMARY KEY,
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  title text NOT NULL,
  sku text NOT NULL,
  state text NOT NULL CHECK (state IN ('available', 'made_to_order', 'sold', 'gallery_only')),
  fulfillment_model text NOT NULL CHECK (fulfillment_model IN ('finished_stock', 'made_to_order', 'gallery_only')),
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  currency char(3) NOT NULL,
  quantity integer NULL CHECK (quantity IS NULL OR quantity >= 0),
  public_checkout boolean NOT NULL DEFAULT false CHECK (public_checkout = false),
  source text NOT NULL,
  lead_time text NULL,
  provider_product_id text NULL,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, sku),
  CHECK (
    (fulfillment_model = 'finished_stock' AND quantity IS NOT NULL)
    OR (fulfillment_model IN ('made_to_order', 'gallery_only') AND quantity IS NULL)
  ),
  CHECK (NOT (state = 'sold' AND fulfillment_model <> 'gallery_only'))
);

CREATE TABLE IF NOT EXISTS inventory_adjustments (
  id text PRIMARY KEY,
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  product_id text NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  delta integer NOT NULL CHECK (delta <> 0),
  before_quantity integer NOT NULL CHECK (before_quantity >= 0),
  after_quantity integer NOT NULL CHECK (after_quantity >= 0),
  expected_version integer NOT NULL CHECK (expected_version > 0),
  resulting_version integer NOT NULL CHECK (resulting_version > expected_version),
  approval_id text NOT NULL,
  idempotency_key text NOT NULL,
  actor text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS orders (
  id text PRIMARY KEY,
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  provider_order_id text NOT NULL,
  status text NOT NULL CHECK (status IN ('open', 'fulfilled', 'cancelled', 'refunded')),
  payment_status text NOT NULL CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
  fulfillment_status text NOT NULL CHECK (fulfillment_status IN ('unfulfilled', 'partial', 'fulfilled')),
  total_cents integer NOT NULL CHECK (total_cents >= 0),
  currency char(3) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, provider_order_id)
);

CREATE TABLE IF NOT EXISTS order_lines (
  id text PRIMARY KEY,
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  order_id text NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  product_id text NULL REFERENCES products(id) ON DELETE RESTRICT,
  sku text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price_cents integer NOT NULL CHECK (unit_price_cents >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS provider_connections (
  id text PRIMARY KEY,
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  provider text NOT NULL CHECK (provider IN ('mock', 'shopify')),
  state text NOT NULL CHECK (state IN ('disconnected', 'connection_requested', 'connected', 'disabled')),
  api_version text NOT NULL,
  secret_reference text NULL,
  connected_at timestamptz NULL,
  disconnected_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, provider)
);

CREATE TABLE IF NOT EXISTS webhook_events (
  id text PRIMARY KEY,
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  provider text NOT NULL CHECK (provider IN ('mock', 'shopify')),
  provider_event_id text NOT NULL,
  topic text NOT NULL,
  payload_hash text NOT NULL,
  signature_valid boolean NOT NULL DEFAULT false,
  processed_at timestamptz NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, provider, provider_event_id)
);

CREATE TABLE IF NOT EXISTS sync_checkpoints (
  id text PRIMARY KEY,
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  provider text NOT NULL CHECK (provider IN ('mock', 'shopify')),
  resource text NOT NULL,
  cursor text NULL,
  last_synced_at timestamptz NULL,
  status text NOT NULL CHECK (status IN ('idle', 'running', 'failed', 'complete')),
  error_code text NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, provider, resource)
);

CREATE TABLE IF NOT EXISTS approvals (
  id text PRIMARY KEY,
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  action text NOT NULL,
  resource_id text NOT NULL,
  requested_by text NOT NULL,
  requested_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  request_hash text NOT NULL,
  before_state_hash text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'approved', 'consumed', 'expired')),
  approved_by text NULL,
  approved_at timestamptz NULL,
  CHECK (expires_at > requested_at)
);

CREATE TABLE IF NOT EXISTS idempotency_records (
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  idempotency_key text NOT NULL,
  request_hash text NOT NULL,
  receipt_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS audit_events (
  id text PRIMARY KEY,
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  actor text NOT NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text NOT NULL,
  before_state_hash text NOT NULL,
  after_state_hash text NOT NULL,
  prior_event_hash text NULL,
  event_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, event_hash)
);

CREATE TABLE IF NOT EXISTS receipts (
  id text PRIMARY KEY,
  work_order_id text NOT NULL,
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  action text NOT NULL,
  actor text NOT NULL,
  provider text NOT NULL CHECK (provider IN ('mock', 'shopify')),
  idempotency_key text NULL,
  approval_id text NULL,
  before_state_hash text NOT NULL,
  after_state_hash text NOT NULL,
  outcome text NOT NULL CHECK (outcome IN ('success', 'blocked', 'replayed')),
  summary jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS exceptions (
  id text PRIMARY KEY,
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  code text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('info', 'warning', 'blocker')),
  summary text NOT NULL,
  resolved_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_tenant ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_tenant ON orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_approvals_tenant ON approvals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_receipts_tenant ON receipts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_tenant ON audit_events(tenant_id, created_at);

-- Every tenant-scoped table is guarded by a transaction-local tenant setting.
DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'products', 'inventory_adjustments', 'orders', 'order_lines', 'provider_connections',
    'webhook_events', 'sync_checkpoints', 'approvals', 'idempotency_records',
    'audit_events', 'receipts', 'exceptions'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', table_name);
    EXECUTE format(
      'CREATE POLICY %I ON %I USING (tenant_id = current_setting(''app.tenant_id'', true)) WITH CHECK (tenant_id = current_setting(''app.tenant_id'', true))',
      table_name || '_tenant_scope', table_name
    );
  END LOOP;
END $$;
