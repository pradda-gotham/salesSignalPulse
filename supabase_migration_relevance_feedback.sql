-- Migration: Add relevance_feedback column to signals table
-- Run this in the Supabase SQL Editor

ALTER TABLE signals
  ADD COLUMN IF NOT EXISTS relevance_feedback TEXT
    CHECK (relevance_feedback IN ('positive', 'negative'));

COMMENT ON COLUMN signals.relevance_feedback IS
  'User feedback on signal relevance: positive (thumbs up) or negative (thumbs down). NULL = unrated.';
