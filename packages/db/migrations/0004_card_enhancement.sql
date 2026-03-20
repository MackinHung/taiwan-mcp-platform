-- Migration: Card Enhancement (Phase B)
-- Adds data source, API key, update frequency, compatible clients, and GitHub URL columns

ALTER TABLE servers ADD COLUMN data_source_agency TEXT;
ALTER TABLE servers ADD COLUMN api_key_required INTEGER DEFAULT 0;
ALTER TABLE servers ADD COLUMN data_update_frequency TEXT;
ALTER TABLE servers ADD COLUMN compatible_clients TEXT DEFAULT '["claude_desktop","cursor","vscode","windsurf","openclaw"]';
ALTER TABLE servers ADD COLUMN github_url TEXT;
