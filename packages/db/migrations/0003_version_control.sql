-- Migration 0003: Version Control + External Security Scan
-- Adds badge_external, external_scan_results, version pinning, package_size

-- Add badge_external to servers table
ALTER TABLE servers ADD COLUMN badge_external TEXT DEFAULT 'unverified'
  CHECK (badge_external IN ('verified', 'partial', 'unverified', 'failed'));

-- Add external scan results to review_reports
ALTER TABLE review_reports ADD COLUMN external_scan_results TEXT;

-- Add version pinning to composition_servers
ALTER TABLE composition_servers ADD COLUMN pinned_version TEXT;

-- Add package size to server_versions
ALTER TABLE server_versions ADD COLUMN package_size INTEGER;
