-- Migration: Add product catalog, rate cards, and estimate audit log tables
-- Run this in the Supabase SQL Editor

-- ============ PRODUCT CATALOG ============
CREATE TABLE IF NOT EXISTS product_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT NOT NULL DEFAULT 'General',
  unit_price NUMERIC(12,2) NOT NULL,
  cost_basis NUMERIC(12,2),
  unit TEXT NOT NULL DEFAULT 'each',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, sku)
);

CREATE INDEX IF NOT EXISTS idx_product_catalog_org ON product_catalog(org_id) WHERE is_active = true;

ALTER TABLE product_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org catalog"
  ON product_catalog FOR SELECT
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage their org catalog"
  ON product_catalog FOR ALL
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

-- ============ RATE CARDS ============
CREATE TABLE IF NOT EXISTS rate_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('labour', 'equipment', 'overhead', 'subContractors', 'materials')),
  description TEXT NOT NULL,
  unit TEXT NOT NULL,
  default_rate NUMERIC(12,2) NOT NULL,
  region TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_cards_org ON rate_cards(org_id) WHERE is_active = true;

ALTER TABLE rate_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org rate cards"
  ON rate_cards FOR SELECT
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage their org rate cards"
  ON rate_cards FOR ALL
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

-- ============ ESTIMATE AUDIT LOG ============
CREATE TABLE IF NOT EXISTS estimate_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  dossier_id TEXT NOT NULL,
  field_path TEXT NOT NULL,
  previous_value JSONB NOT NULL,
  new_value JSONB NOT NULL,
  changed_by UUID,
  changed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_dossier ON estimate_audit_log(dossier_id);

ALTER TABLE estimate_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org audit logs"
  ON estimate_audit_log FOR SELECT
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert their org audit logs"
  ON estimate_audit_log FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));
