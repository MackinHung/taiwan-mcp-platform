import type { BehaviorTrace } from './types.js';

const NETWORK_PATTERNS: { pattern: RegExp; methodExtractor: (m: RegExpMatchArray) => string }[] = [
  { pattern: /\bfetch\s*\(\s*['"`]([^'"`]+)['"`]/, methodExtractor: () => 'GET' },
  { pattern: /\baxios\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/, methodExtractor: (m) => m[1].toUpperCase() },
  { pattern: /\baxios\s*\(\s*\{[^}]*url:\s*['"`]([^'"`]+)['"`]/, methodExtractor: () => 'GET' },
  { pattern: /\bhttps?\.request\s*\(\s*['"`]([^'"`]+)['"`]/, methodExtractor: () => 'GET' },
  { pattern: /\bgot\s*\(\s*['"`]([^'"`]+)['"`]/, methodExtractor: () => 'GET' },
  { pattern: /\bgot\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/, methodExtractor: (m) => m[1].toUpperCase() },
  { pattern: /\bsuperagent\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/, methodExtractor: (m) => m[1].toUpperCase() },
  { pattern: /new\s+URL\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/, methodExtractor: () => 'GET' },
];

const ENV_PATTERNS: RegExp[] = [
  /\bprocess\.env\.([A-Z_][A-Z0-9_]*)/,
  /\bprocess\.env\[['"`]([^'"`]+)['"`]\]/,
  /\bDeno\.env\.get\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/,
];

const FS_PATTERNS: { pattern: RegExp; operation: 'read' | 'write' | 'delete' }[] = [
  { pattern: /\bfs\.readFileSync\s*\(\s*['"`]([^'"`]+)['"`]/, operation: 'read' },
  { pattern: /\bfs\.readFile\s*\(\s*['"`]([^'"`]+)['"`]/, operation: 'read' },
  { pattern: /\bfs\.createReadStream\s*\(\s*['"`]([^'"`]+)['"`]/, operation: 'read' },
  { pattern: /\bfs\.writeFileSync\s*\(\s*['"`]([^'"`]+)['"`]/, operation: 'write' },
  { pattern: /\bfs\.writeFile\s*\(\s*['"`]([^'"`]+)['"`]/, operation: 'write' },
  { pattern: /\bfs\.createWriteStream\s*\(\s*['"`]([^'"`]+)['"`]/, operation: 'write' },
  { pattern: /\bfs\.unlinkSync\s*\(\s*['"`]([^'"`]+)['"`]/, operation: 'delete' },
  { pattern: /\bfs\.unlink\s*\(\s*['"`]([^'"`]+)['"`]/, operation: 'delete' },
];

const SPAWN_PATTERNS: RegExp[] = [
  /\b(?:child_process\.)?exec\s*\(\s*['"`]([^'"`]+)['"`]/,
  /\b(?:child_process\.)?execSync\s*\(\s*['"`]([^'"`]+)['"`]/,
  /\b(?:child_process\.)?spawn\s*\(\s*['"`]([^'"`]+)['"`]/,
  /\b(?:child_process\.)?spawnSync\s*\(\s*['"`]([^'"`]+)['"`]/,
  /\b(?:child_process\.)?fork\s*\(\s*['"`]([^'"`]+)['"`]/,
];

const EVAL_PATTERNS: RegExp[] = [
  /\beval\s*\(/,
  /\bnew\s+Function\s*\(/,
  /\bvm\.runInContext\s*\(/,
  /\bvm\.createScript\s*\(/,
];

function isInBlockComment(lines: string[], lineIndex: number): boolean {
  let inBlock = false;
  for (let i = 0; i < lineIndex; i++) {
    const line = lines[i];
    if (!inBlock && line.includes('/*')) {
      inBlock = true;
    }
    if (inBlock && line.includes('*/')) {
      inBlock = false;
    }
  }
  // Check current line for opening block comment before the match
  const currentLine = lines[lineIndex];
  if (!inBlock && currentLine.includes('/*') && !currentLine.includes('*/')) {
    return true;
  }
  if (!inBlock && currentLine.includes('/*') && currentLine.includes('*/')) {
    // Block comment opens and closes on same line - not "in" block
    return false;
  }
  return inBlock;
}

function isCommentLine(line: string, lines: string[], lineIndex: number): boolean {
  const trimmed = line.trim();
  if (trimmed.startsWith('//')) {
    return true;
  }
  return isInBlockComment(lines, lineIndex);
}

function extractUrlFromMatch(match: RegExpMatchArray, pattern: RegExp): string {
  // For axios/got/superagent with method, URL is in group 2
  if (pattern.source.includes('\\.(get|post|put|delete|patch)')) {
    return match[2];
  }
  return match[1];
}

export function analyzeTrace(sourceCode: string): BehaviorTrace {
  const lines = sourceCode.split('\n');
  const networkCalls: BehaviorTrace['networkCalls'] = [];
  const envAccess: string[] = [];
  const fsOperations: BehaviorTrace['fsOperations'] = [];
  const processSpawns: string[] = [];
  const dynamicEval: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isCommentLine(line, lines, i)) {
      continue;
    }

    for (const { pattern, methodExtractor } of NETWORK_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        const url = extractUrlFromMatch(match, pattern);
        networkCalls.push({ url, method: methodExtractor(match), line: i + 1 });
      }
    }

    for (const pattern of ENV_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        envAccess.push(match[1]);
      }
    }

    for (const { pattern, operation } of FS_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        fsOperations.push({ operation, path: match[1], line: i + 1 });
      }
    }

    for (const pattern of SPAWN_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        processSpawns.push(match[1]);
      }
    }

    for (const pattern of EVAL_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        dynamicEval.push(match[0].trim());
      }
    }
  }

  return { networkCalls, envAccess, fsOperations, processSpawns, dynamicEval };
}
