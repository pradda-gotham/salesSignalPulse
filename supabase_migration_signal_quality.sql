-- Migration: Signal quality enhancements
-- Adds lead classification, entity extraction, research hints,
-- and a cross-run semantic fingerprint for deduplication.
-- Run this in the Supabase SQL Editor.

ALTER TABLE signals
  ADD COLUMN IF NOT EXISTS lead_type TEXT
    CHECK (lead_type IN ('direct_company', 'government_tender', 'project_winner', 'market_trend')),
  ADD COLUMN IF NOT EXISTS semantic_fingerprint TEXT,
  ADD COLUMN IF NOT EXISTS entities JSONB,
  ADD COLUMN IF NOT EXISTS research_hints JSONB,
  ADD COLUMN IF NOT EXISTS relevance_score INT
    CHECK (relevance_score IS NULL OR (relevance_score >= 0 AND relevance_score <= 100)),
  ADD COLUMN IF NOT EXISTS relevance_reasoning TEXT;

COMMENT ON COLUMN signals.lead_type IS
  'Classification of the signal: direct_company (named buyer), government_tender (public RFP), project_winner (indirect buyer — contractor that won work), market_trend (dashboard-only trend, not a lead).';
COMMENT ON COLUMN signals.semantic_fingerprint IS
  'Cross-run dedup key: hash of accountName + event + weekBucket. Prevents same opportunity appearing day after day.';
COMMENT ON COLUMN signals.entities IS
  'Extracted entities from the signal (companies, government bodies, people) with role labels.';
COMMENT ON COLUMN signals.research_hints IS
  'Structured hints for acting on indirect leads (tender portal URL, LinkedIn search URL, next action).';
COMMENT ON COLUMN signals.relevance_score IS
  'AI-assigned relevance score (0-100) from the post-hunt scoring pass.';
COMMENT ON COLUMN signals.relevance_reasoning IS
  'Why the relevance scorer accepted or rejected this signal.';

-- Unique index on semantic fingerprint prevents the same opportunity being
-- stored twice across different hunt runs.
CREATE UNIQUE INDEX IF NOT EXISTS signals_org_semantic_fingerprint_idx
  ON signals (org_id, semantic_fingerprint)
  WHERE semantic_fingerprint IS NOT NULL;

CREATE INDEX IF NOT EXISTS signals_lead_type_idx
  ON signals (org_id, lead_type)
  WHERE lead_type IS NOT NULL;
