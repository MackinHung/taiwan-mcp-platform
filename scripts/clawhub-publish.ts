/**
 * ClawHub batch publish script
 *
 * Scans skills/ directory, validates SKILL.md frontmatter,
 * and publishes to ClawHub via `clawhub sync`.
 *
 * Usage:
 *   npx tsx scripts/clawhub-publish.ts              # publish all
 *   npx tsx scripts/clawhub-publish.ts --dry-run     # preview only
 *   npx tsx scripts/clawhub-publish.ts --concurrency 4
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SkillMeta {
  name: string;
  description: string;
  version: string;
  metadata?: {
    openclaw?: {
      requires?: { env?: string[]; bins?: string[] };
      primaryEnv?: string;
      homepage?: string;
      os?: string[];
    };
  };
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface PublishOptions {
  readonly dryRun: boolean;
  readonly concurrency: number;
  readonly skillsDir: string;
  readonly maxRetries?: number;
}

export interface PublishResult {
  readonly total: number;
  readonly valid: number;
  readonly invalid: number;
  readonly published: number;
  readonly errors: ReadonlyMap<string, readonly string[]>;
}

// ---------------------------------------------------------------------------
// Frontmatter parsing
// ---------------------------------------------------------------------------

export function parseSkillFrontmatter(content: string): SkillMeta | null {
  if (!content || !content.startsWith('---')) return null;

  const endIdx = content.indexOf('---', 3);
  if (endIdx === -1) return null;

  const yamlBlock = content.slice(3, endIdx).trim();

  try {
    const result: Record<string, unknown> = {};
    const lines = yamlBlock.replace(/\r\n/g, '\n').split('\n');
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const topMatch = line.match(/^(\w[\w-]*):\s*(.*)$/);
      if (topMatch) {
        const [, key, value] = topMatch;
        if (value.startsWith('"') || value.startsWith("'")) {
          result[key] = value.replace(/^["']|["']$/g, '');
        } else if (value.startsWith('[')) {
          result[key] = parseInlineArray(value);
        } else if (value === '' || value === undefined) {
          const nested = parseNested(lines, i + 1, 2);
          result[key] = nested.obj;
          i = nested.nextIdx;
          continue;
        } else {
          result[key] = value;
        }
      }
      i++;
    }

    const meta = result as unknown as SkillMeta;
    if (!meta.name && !meta.description) return null;
    return meta;
  } catch {
    return null;
  }
}

function parseInlineArray(value: string): string[] {
  return value
    .replace(/^\[|\]$/g, '')
    .split(',')
    .map((s) => s.trim());
}

interface NestedResult {
  obj: Record<string, unknown>;
  nextIdx: number;
}

function collectList(
  lines: string[],
  startIdx: number,
  indent: number,
): { items: string[]; nextIdx: number } {
  const items: string[] = [];
  const prefix = ' '.repeat(indent);
  let i = startIdx;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.startsWith(prefix) || line.trim() === '') break;
    const trimmed = line.slice(indent);
    const listMatch = trimmed.match(/^-\s+(.+)$/);
    if (listMatch) {
      items.push(listMatch[1].trim());
      i++;
    } else {
      break;
    }
  }

  return { items, nextIdx: i };
}

function parseNested(
  lines: string[],
  startIdx: number,
  indent: number,
): NestedResult {
  const obj: Record<string, unknown> = {};
  let i = startIdx;
  const prefix = ' '.repeat(indent);

  while (i < lines.length) {
    const line = lines[i];
    if (!line.startsWith(prefix) || line.trim() === '') break;

    const trimmed = line.slice(indent);
    if (trimmed.startsWith(' ')) break;

    const kvMatch = trimmed.match(/^(\w[\w-]*):\s*(.*)$/);

    if (kvMatch) {
      const [, key, value] = kvMatch;
      if (value === '' || value === undefined) {
        const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
        const nextTrimmed = nextLine.startsWith(prefix + '  ')
          ? nextLine.slice(indent + 2)
          : '';

        if (nextTrimmed.startsWith('- ')) {
          const list = collectList(lines, i + 1, indent + 2);
          obj[key] = list.items;
          i = list.nextIdx;
          continue;
        } else {
          const nested = parseNested(lines, i + 1, indent + 2);
          obj[key] = nested.obj;
          i = nested.nextIdx;
          continue;
        }
      } else if (value.startsWith('[')) {
        obj[key] = parseInlineArray(value);
      } else if (value.startsWith('"') || value.startsWith("'")) {
        obj[key] = value.replace(/^["']|["']$/g, '');
      } else {
        obj[key] = value;
      }
    }
    i++;
  }

  return { obj, nextIdx: i };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export function validateSkillMd(
  content: string,
  dirName: string,
): ValidationResult {
  const errors: string[] = [];

  const meta = parseSkillFrontmatter(content);
  if (!meta) {
    return { valid: false, errors: ['Could not parse YAML frontmatter'] };
  }

  if (!meta.name) errors.push('Missing required field: name');
  if (!meta.description) errors.push('Missing required field: description');
  if (!meta.version) errors.push('Missing required field: version');

  if (meta.name && meta.name !== dirName) {
    errors.push(`name "${meta.name}" does not match directory "${dirName}"`);
  }

  const openclaw = meta.metadata?.openclaw;
  if (!openclaw) {
    errors.push('Missing required field: metadata.openclaw');
  } else if (!openclaw.primaryEnv) {
    errors.push('Missing required field: metadata.openclaw.primaryEnv');
  }

  if (!content.includes('## Tools')) {
    errors.push('Missing ## Tools section');
  }
  if (!content.includes('## Usage')) {
    errors.push('Missing ## Usage section');
  }

  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// Discovery
// ---------------------------------------------------------------------------

export function discoverSkills(skillsDir: string): string[] {
  const entries = fs.readdirSync(skillsDir);
  const skills: string[] = [];

  for (const entry of entries) {
    const entryStr = typeof entry === 'string' ? entry : String(entry);
    if (entryStr.startsWith('.')) continue;

    const fullPath = path.join(skillsDir, entryStr);
    const stat = fs.statSync(fullPath);
    if (!stat.isDirectory()) continue;

    const skillPath = path.join(fullPath, 'SKILL.md');
    if (fs.existsSync(skillPath)) {
      skills.push(entryStr);
    }
  }

  return skills.sort();
}

// ---------------------------------------------------------------------------
// Retry with exponential backoff
// ---------------------------------------------------------------------------

export function execWithRetry(
  cmd: string,
  maxRetries: number = 3,
): { success: boolean; error?: string } {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      execSync(cmd, { stdio: 'inherit' });
      return { success: true };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      const isRateLimit = errMsg.includes('429') || errMsg.includes('rate limit');

      if (isRateLimit && attempt < maxRetries) {
        const delayMs = Math.pow(2, attempt) * 1000;
        console.log(
          `  Rate limited (429). Retry ${attempt + 1}/${maxRetries} after ${delayMs}ms...`,
        );
        sleepSync(delayMs);
        continue;
      }

      return { success: false, error: errMsg };
    }
  }

  return { success: false, error: 'Max retries exceeded' };
}

function sleepSync(ms: number): void {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    // busy wait for sync sleep
  }
}

// ---------------------------------------------------------------------------
// Publish
// ---------------------------------------------------------------------------

export function publishAll(options: PublishOptions): PublishResult {
  const { dryRun, concurrency, skillsDir, maxRetries = 3 } = options;
  const skills = discoverSkills(skillsDir);

  let valid = 0;
  let invalid = 0;
  let published = 0;
  const errors = new Map<string, string[]>();

  console.log(`\nDiscovered ${skills.length} skills in ${skillsDir}\n`);

  for (const skill of skills) {
    const skillPath = path.join(skillsDir, skill, 'SKILL.md');
    const content = fs.readFileSync(skillPath, 'utf-8');
    const validation = validateSkillMd(content, skill);

    if (validation.valid) {
      valid++;
      console.log(`  [OK] ${skill}`);
    } else {
      invalid++;
      errors.set(skill, validation.errors);
      console.log(`  [FAIL] ${skill}`);
      for (const err of validation.errors) {
        console.log(`         - ${err}`);
      }
    }
  }

  console.log(`\nValidation: ${valid} OK, ${invalid} FAILED out of ${skills.length}\n`);

  if (invalid > 0) {
    console.log('Aborting publish due to validation errors.');
    return { total: skills.length, valid, invalid, published, errors };
  }

  if (dryRun) {
    console.log('[DRY RUN] Would run:');
    console.log(`  clawhub sync --root ${skillsDir} --all --concurrency ${concurrency}`);
    return { total: skills.length, valid, invalid, published: valid, errors };
  }

  const cmd = `clawhub sync --root ${skillsDir} --all --concurrency ${concurrency}`;
  console.log(`Running: ${cmd}\n`);

  const result = execWithRetry(cmd, maxRetries);
  if (result.success) {
    published = valid;
  } else {
    console.error('Publish failed:', result.error);
  }

  return { total: skills.length, valid, invalid, published, errors };
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

function main(): void {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const concurrencyIdx = args.indexOf('--concurrency');
  const concurrency =
    concurrencyIdx !== -1 ? parseInt(args[concurrencyIdx + 1], 10) || 2 : 2;

  const rootDir = path.resolve(__dirname, '..');
  const skillsDir = path.join(rootDir, 'skills');

  if (!fs.existsSync(skillsDir)) {
    console.error(`Skills directory not found: ${skillsDir}`);
    process.exit(1);
  }

  const result = publishAll({ dryRun, concurrency, skillsDir });

  if (result.invalid > 0) {
    process.exit(1);
  }

  const verb = dryRun ? 'would be' : '';
  console.log(`\nDone. ${result.published}/${result.total} skills ${verb} published.`);
}

const isDirectRun =
  typeof require !== 'undefined' &&
  require.main === module;

if (isDirectRun) {
  main();
}
