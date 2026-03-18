export interface RuleResult {
  ruleName: string;
  pass: boolean;
  severity: 'info' | 'warn' | 'fail';
  details: string;
}

/**
 * Popular npm packages that are frequent typosquatting targets.
 * Sorted by download count / attack frequency.
 */
const POPULAR_PACKAGES = [
  'express', 'lodash', 'axios', 'react', 'request', 'chalk',
  'commander', 'moment', 'debug', 'async', 'bluebird', 'underscore',
  'uuid', 'minimist', 'glob', 'mkdirp', 'yargs', 'semver',
  'dotenv', 'body-parser', 'cors', 'mongoose', 'webpack', 'babel',
  'eslint', 'prettier', 'typescript', 'esbuild', 'rollup', 'vite',
  'vitest', 'jest', 'mocha', 'chai', 'sinon', 'supertest',
  'node-fetch', 'cross-env', 'cross-spawn', 'rimraf', 'fs-extra',
  'inquirer', 'ora', 'got', 'cheerio', 'puppeteer', 'playwright',
  'hono', 'fastify', 'koa', 'socket.io', 'redis', 'pg',
  'mysql2', 'sequelize', 'prisma', 'drizzle-orm', 'zod',
];

/**
 * Calculate Levenshtein edit distance between two strings.
 */
function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // deletion
        dp[i][j - 1] + 1,      // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return dp[m][n];
}

/**
 * Check if a package name is suspiciously close to a popular package.
 * Returns the popular package name if suspicious, null otherwise.
 */
function findSimilarPopularPackage(name: string): string | null {
  // Skip if the name IS a popular package (exact match)
  if (POPULAR_PACKAGES.includes(name)) return null;

  // Also check without hyphens (e.g., "nodefetch" → "node-fetch")
  const nameNoHyphen = name.replace(/-/g, '');

  for (const popular of POPULAR_PACKAGES) {
    const popularNoHyphen = popular.replace(/-/g, '');

    // Edit distance check (allow up to 2 for all names with length > 3)
    const threshold = popular.length <= 3 ? 1 : 2;
    const dist = editDistance(name, popular);

    if (dist > 0 && dist <= threshold) {
      return popular;
    }

    // Hyphen-omission check (e.g., "nodefetch" vs "node-fetch")
    if (name !== popular && nameNoHyphen === popularNoHyphen) {
      return popular;
    }

    // Hyphen variant with no-hyphen match
    if (popular.includes('-') && nameNoHyphen === popularNoHyphen && name !== popular) {
      return popular;
    }
  }

  return null;
}

export function typosquattingDetect(dependencies: Record<string, string>): RuleResult {
  const depNames = Object.keys(dependencies);

  if (depNames.length === 0) {
    return {
      ruleName: 'typosquatting-detect',
      pass: true,
      severity: 'info',
      details: 'No dependencies to check',
    };
  }

  const suspicious: Array<{ name: string; similar: string }> = [];

  for (const name of depNames) {
    const similar = findSimilarPopularPackage(name);
    if (similar) {
      suspicious.push({ name, similar });
    }
  }

  if (suspicious.length === 0) {
    return {
      ruleName: 'typosquatting-detect',
      pass: true,
      severity: 'info',
      details: `${depNames.length} dependencies checked, no typosquatting detected`,
    };
  }

  const details = suspicious
    .map((s) => `"${s.name}" looks like "${s.similar}"`)
    .join('; ');

  return {
    ruleName: 'typosquatting-detect',
    pass: false,
    severity: suspicious.length >= 2 ? 'fail' : 'warn',
    details: `Possible typosquatting: ${details}`,
  };
}
