import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  parseSkillFrontmatter,
  validateSkillMd,
  discoverSkills,
  execWithRetry,
  publishAll,
} from '../clawhub-publish.js';
import * as fs from 'node:fs';
import { execSync } from 'node:child_process';

vi.mock('node:fs');
vi.mock('node:child_process');

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const VALID_SKILL_MD = `---
name: taiwan-weather
description: "8 tools for Taiwan CWA weather data"
version: 1.0.0
metadata:
  openclaw:
    requires:
      env:
        - TW_MCP_API_KEY
      bins:
        - node
    primaryEnv: TW_MCP_API_KEY
    homepage: https://tw-mcp.pages.dev
    os: [macos, linux, windows]
---

# Taiwan Weather MCP Server

Some description here.

## Tools

| Tool | Description |
|------|-------------|
| \`get_forecast_36hr\` | Get forecast |

## Usage

Example config here.
`;

// ---------------------------------------------------------------------------
// parseSkillFrontmatter
// ---------------------------------------------------------------------------

describe('parseSkillFrontmatter', () => {
  it('parses valid YAML frontmatter with nested objects and lists', () => {
    const result = parseSkillFrontmatter(VALID_SKILL_MD);
    expect(result).not.toBeNull();
    expect(result!.name).toBe('taiwan-weather');
    expect(result!.description).toBe('8 tools for Taiwan CWA weather data');
    expect(result!.version).toBe('1.0.0');
    expect(result!.metadata?.openclaw?.primaryEnv).toBe('TW_MCP_API_KEY');
    expect(result!.metadata?.openclaw?.os).toEqual(['macos', 'linux', 'windows']);
  });

  it('returns null for content without frontmatter', () => {
    expect(parseSkillFrontmatter('# No frontmatter here')).toBeNull();
  });

  it('returns null for empty content', () => {
    expect(parseSkillFrontmatter('')).toBeNull();
  });

  it('returns null for missing closing frontmatter delimiter', () => {
    const content = `---
name: taiwan-weather
description: "some tools"
No closing delimiter here`;
    expect(parseSkillFrontmatter(content)).toBeNull();
  });

  it('handles Windows \\r\\n line endings', () => {
    const content =
      '---\r\nname: taiwan-test\r\ndescription: "test"\r\nversion: 1.0.0\r\n---\r\n# Content';
    const result = parseSkillFrontmatter(content);
    expect(result).not.toBeNull();
    expect(result!.name).toBe('taiwan-test');
  });
});

// ---------------------------------------------------------------------------
// validateSkillMd
// ---------------------------------------------------------------------------

describe('validateSkillMd', () => {
  it('validates a correct SKILL.md', () => {
    const result = validateSkillMd(VALID_SKILL_MD, 'taiwan-weather');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('fails when name is missing', () => {
    const content = `---
description: "some tools"
version: 1.0.0
metadata:
  openclaw:
    requires:
      env:
        - TW_MCP_API_KEY
      bins:
        - node
    primaryEnv: TW_MCP_API_KEY
    homepage: https://tw-mcp.pages.dev
    os: [macos, linux, windows]
---

## Tools
## Usage`;
    const result = validateSkillMd(content, 'taiwan-weather');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing required field: name');
  });

  it('fails when name does not match directory', () => {
    const result = validateSkillMd(VALID_SKILL_MD, 'taiwan-stock');
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('does not match directory'))).toBe(true);
  });

  it('fails when description is missing', () => {
    const content = `---
name: taiwan-weather
version: 1.0.0
metadata:
  openclaw:
    requires:
      env:
        - TW_MCP_API_KEY
      bins:
        - node
    primaryEnv: TW_MCP_API_KEY
    homepage: https://tw-mcp.pages.dev
    os: [macos, linux, windows]
---

## Tools
## Usage`;
    const result = validateSkillMd(content, 'taiwan-weather');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing required field: description');
  });

  it('fails when version is missing', () => {
    const content = `---
name: taiwan-weather
description: "tools"
metadata:
  openclaw:
    requires:
      env:
        - TW_MCP_API_KEY
      bins:
        - node
    primaryEnv: TW_MCP_API_KEY
    homepage: https://tw-mcp.pages.dev
    os: [macos, linux, windows]
---

## Tools
## Usage`;
    const result = validateSkillMd(content, 'taiwan-weather');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing required field: version');
  });

  it('fails when openclaw metadata is missing', () => {
    const content = `---
name: taiwan-weather
description: "tools"
version: 1.0.0
---

## Tools
## Usage`;
    const result = validateSkillMd(content, 'taiwan-weather');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing required field: metadata.openclaw');
  });

  it('fails when primaryEnv is missing', () => {
    const content = `---
name: taiwan-weather
description: "tools"
version: 1.0.0
metadata:
  openclaw:
    requires:
      env:
        - TW_MCP_API_KEY
      bins:
        - node
    homepage: https://tw-mcp.pages.dev
    os: [macos, linux, windows]
---

## Tools
## Usage`;
    const result = validateSkillMd(content, 'taiwan-weather');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing required field: metadata.openclaw.primaryEnv');
  });

  it('fails when frontmatter cannot be parsed', () => {
    const result = validateSkillMd('# No frontmatter', 'taiwan-weather');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Could not parse YAML frontmatter');
  });

  it('fails when ## Tools section is missing', () => {
    const content = `---
name: taiwan-weather
description: "tools"
version: 1.0.0
metadata:
  openclaw:
    requires:
      env:
        - TW_MCP_API_KEY
      bins:
        - node
    primaryEnv: TW_MCP_API_KEY
    homepage: https://tw-mcp.pages.dev
    os: [macos, linux, windows]
---

# Taiwan Weather

No tools section here.

## Usage

config`;
    const result = validateSkillMd(content, 'taiwan-weather');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing ## Tools section');
  });

  it('fails when ## Usage section is missing', () => {
    const content = `---
name: taiwan-weather
description: "tools"
version: 1.0.0
metadata:
  openclaw:
    requires:
      env:
        - TW_MCP_API_KEY
      bins:
        - node
    primaryEnv: TW_MCP_API_KEY
    homepage: https://tw-mcp.pages.dev
    os: [macos, linux, windows]
---

# Taiwan Weather

## Tools

| Tool | Description |
|------|-------------|
| \`get_forecast\` | Get forecast |`;
    const result = validateSkillMd(content, 'taiwan-weather');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing ## Usage section');
  });

  it('reports multiple errors at once', () => {
    const content = `---
name: wrong-name
---

# Content`;
    const result = validateSkillMd(content, 'taiwan-weather');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });
});

// ---------------------------------------------------------------------------
// discoverSkills
// ---------------------------------------------------------------------------

describe('discoverSkills', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('discovers skill directories with SKILL.md', () => {
    vi.mocked(fs.readdirSync).mockReturnValue([
      'taiwan-weather',
      'taiwan-stock',
      '.hidden',
    ] as unknown as fs.Dirent[]);
    vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => true } as fs.Stats);
    vi.mocked(fs.existsSync).mockImplementation((p: fs.PathLike) => {
      return !String(p).includes('.hidden');
    });

    const skills = discoverSkills('/fake/skills');
    expect(skills).toHaveLength(2);
    expect(skills).toContain('taiwan-weather');
    expect(skills).toContain('taiwan-stock');
  });

  it('skips directories without SKILL.md', () => {
    vi.mocked(fs.readdirSync).mockReturnValue([
      'taiwan-weather',
      'empty-dir',
    ] as unknown as fs.Dirent[]);
    vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => true } as fs.Stats);
    vi.mocked(fs.existsSync).mockImplementation((p: fs.PathLike) => {
      return String(p).includes('taiwan-weather');
    });

    const skills = discoverSkills('/fake/skills');
    expect(skills).toEqual(['taiwan-weather']);
  });

  it('returns empty array for empty directory', () => {
    vi.mocked(fs.readdirSync).mockReturnValue([] as unknown as fs.Dirent[]);
    expect(discoverSkills('/fake/skills')).toEqual([]);
  });

  it('returns results sorted alphabetically', () => {
    vi.mocked(fs.readdirSync).mockReturnValue([
      'taiwan-stock',
      'taiwan-air-quality',
      'taiwan-weather',
    ] as unknown as fs.Dirent[]);
    vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => true } as fs.Stats);
    vi.mocked(fs.existsSync).mockReturnValue(true);

    const skills = discoverSkills('/fake/skills');
    expect(skills).toEqual(['taiwan-air-quality', 'taiwan-stock', 'taiwan-weather']);
  });
});

// ---------------------------------------------------------------------------
// execWithRetry
// ---------------------------------------------------------------------------

describe('execWithRetry', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('succeeds on first attempt', () => {
    vi.mocked(execSync).mockReturnValue(Buffer.from(''));
    const result = execWithRetry('clawhub sync --all', 3);
    expect(result.success).toBe(true);
    expect(execSync).toHaveBeenCalledTimes(1);
  });

  it('retries on 429 rate limit and succeeds', () => {
    const mockExec = vi.mocked(execSync);
    mockExec
      .mockImplementationOnce(() => { throw new Error('HTTP 429 Too Many Requests'); })
      .mockReturnValue(Buffer.from(''));

    const result = execWithRetry('clawhub sync --all', 3);
    expect(result.success).toBe(true);
    expect(mockExec).toHaveBeenCalledTimes(2);
  });

  it('fails after max retries on persistent 429', () => {
    const mockExec = vi.mocked(execSync);
    mockExec.mockImplementation(() => { throw new Error('429 rate limit'); });

    const result = execWithRetry('clawhub sync --all', 2);
    expect(result.success).toBe(false);
    expect(result.error).toContain('429');
    // 1 initial + 2 retries = 3 calls
    expect(mockExec).toHaveBeenCalledTimes(3);
  });

  it('does not retry on non-429 errors', () => {
    vi.mocked(execSync).mockImplementation(() => {
      throw new Error('Command not found');
    });

    const result = execWithRetry('clawhub sync --all', 3);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Command not found');
    expect(execSync).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// publishAll (dry-run mode)
// ---------------------------------------------------------------------------

describe('publishAll', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('dry-run mode validates but does not call clawhub CLI', () => {
    vi.mocked(fs.readdirSync).mockReturnValue([
      'taiwan-weather',
    ] as unknown as fs.Dirent[]);
    vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => true } as fs.Stats);
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(VALID_SKILL_MD);

    const result = publishAll({
      dryRun: true,
      concurrency: 2,
      skillsDir: '/fake/skills',
    });

    expect(result.total).toBe(1);
    expect(result.valid).toBe(1);
    expect(result.invalid).toBe(0);
    expect(result.published).toBe(1);
    expect(execSync).not.toHaveBeenCalled();
  });

  it('aborts publish when validation fails', () => {
    vi.mocked(fs.readdirSync).mockReturnValue([
      'taiwan-bad',
    ] as unknown as fs.Dirent[]);
    vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => true } as fs.Stats);
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue('# No frontmatter');

    const result = publishAll({
      dryRun: false,
      concurrency: 2,
      skillsDir: '/fake/skills',
    });

    expect(result.invalid).toBe(1);
    expect(result.published).toBe(0);
    expect(execSync).not.toHaveBeenCalled();
  });

  it('returns zero totals for empty skills directory', () => {
    vi.mocked(fs.readdirSync).mockReturnValue([] as unknown as fs.Dirent[]);

    const result = publishAll({
      dryRun: true,
      concurrency: 2,
      skillsDir: '/fake/skills',
    });

    expect(result.total).toBe(0);
    expect(result.valid).toBe(0);
    expect(result.published).toBe(0);
  });
});
