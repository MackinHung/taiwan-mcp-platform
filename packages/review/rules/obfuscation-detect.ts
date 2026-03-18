export interface RuleResult {
  ruleName: string;
  pass: boolean;
  severity: 'info' | 'warn' | 'fail';
  details: string;
}

// Detect long runs of hex escape sequences: \x68\x65...
const HEX_ESCAPE_REGEX = /(\\x[0-9a-fA-F]{2}){6,}/;

// Detect long runs of unicode escape sequences: \u0068\u0065...
const UNICODE_ESCAPE_REGEX = /(\\u[0-9a-fA-F]{4}){6,}/;

// Detect String.fromCharCode with many arguments
const FROM_CHARCODE_REGEX = /String\.fromCharCode\s*\(/;

// Detect atob() usage (base64 decode)
const ATOB_REGEX = /\batob\s*\(/;

// Detect long base64 blobs (100+ chars of valid base64)
const BASE64_BLOB_REGEX = /["'`][A-Za-z0-9+/]{100,}={0,2}["'`]/;

// Detect single-char variable declarations: var a=, let b=, const c=
const SINGLE_CHAR_VAR_REGEX = /\b(?:var|let|const)\s+[a-zA-Z]\s*=/g;

// Threshold for "too many single-char variables"
const SINGLE_CHAR_VAR_THRESHOLD = 10;

// Minification: single line longer than 1000 chars
const MINIFIED_LINE_THRESHOLD = 1000;

export function obfuscationDetect(sourceCode: string): RuleResult {
  if (!sourceCode) {
    return { ruleName: 'obfuscation-detect', pass: true, severity: 'info', details: 'No source code to analyze' };
  }

  const warnings: string[] = [];

  // Check hex escape sequences
  if (HEX_ESCAPE_REGEX.test(sourceCode)) {
    warnings.push('hex-escaped strings detected');
  }

  // Check unicode escape sequences
  if (UNICODE_ESCAPE_REGEX.test(sourceCode)) {
    warnings.push('unicode-escaped strings detected');
  }

  // Check String.fromCharCode
  if (FROM_CHARCODE_REGEX.test(sourceCode)) {
    warnings.push('String.fromCharCode usage detected');
  }

  // Check atob (base64 decode)
  if (ATOB_REGEX.test(sourceCode)) {
    warnings.push('atob() base64 decode detected');
  }

  // Check long base64 blobs
  if (BASE64_BLOB_REGEX.test(sourceCode)) {
    warnings.push('long base64-encoded blob detected');
  }

  // Check for minified code (extremely long lines)
  const lines = sourceCode.split('\n');
  const hasMinifiedLine = lines.some((line) => line.length > MINIFIED_LINE_THRESHOLD);
  if (hasMinifiedLine) {
    warnings.push('possible minified/bundled code (line > 1000 chars)');
  }

  // Check for excessive single-char variable names
  const singleCharMatches = sourceCode.match(SINGLE_CHAR_VAR_REGEX) ?? [];
  if (singleCharMatches.length >= SINGLE_CHAR_VAR_THRESHOLD) {
    warnings.push(`excessive single-char variable names (${singleCharMatches.length} found)`);
  }

  if (warnings.length === 0) {
    return {
      ruleName: 'obfuscation-detect',
      pass: true,
      severity: 'info',
      details: 'No code obfuscation patterns detected',
    };
  }

  // Multiple obfuscation signals = higher severity
  const severity = warnings.length >= 3 ? 'fail' : 'warn';

  return {
    ruleName: 'obfuscation-detect',
    pass: false,
    severity,
    details: `Possible code obfuscation: ${warnings.join(', ')}`,
  };
}
