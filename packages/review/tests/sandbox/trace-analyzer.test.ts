import { describe, it, expect } from 'vitest';
import { analyzeTrace } from '../../src/sandbox/trace-analyzer.js';

describe('analyzeTrace', () => {
  describe('networkCalls', () => {
    it('detects fetch() calls', () => {
      const code = `const data = fetch('https://api.example.com/data');`;
      const trace = analyzeTrace(code);
      expect(trace.networkCalls).toHaveLength(1);
      expect(trace.networkCalls[0]).toEqual({
        url: 'https://api.example.com/data',
        method: 'GET',
        line: 1,
      });
    });

    it('detects axios.get/post/put/delete', () => {
      const code = [
        `axios.get('https://api.example.com/get');`,
        `axios.post('https://api.example.com/post');`,
        `axios.put('https://api.example.com/put');`,
        `axios.delete('https://api.example.com/del');`,
      ].join('\n');
      const trace = analyzeTrace(code);
      expect(trace.networkCalls).toHaveLength(4);
      expect(trace.networkCalls[0].method).toBe('GET');
      expect(trace.networkCalls[1].method).toBe('POST');
      expect(trace.networkCalls[2].method).toBe('PUT');
      expect(trace.networkCalls[3].method).toBe('DELETE');
    });

    it('detects http.request and https.request', () => {
      const code = [
        `http.request('http://localhost:3000/api');`,
        `https.request('https://secure.example.com/api');`,
      ].join('\n');
      const trace = analyzeTrace(code);
      expect(trace.networkCalls).toHaveLength(2);
      expect(trace.networkCalls[0].url).toBe('http://localhost:3000/api');
      expect(trace.networkCalls[1].url).toBe('https://secure.example.com/api');
    });

    it('detects got() calls', () => {
      const code = `got('https://httpbin.org/get');`;
      const trace = analyzeTrace(code);
      expect(trace.networkCalls).toHaveLength(1);
      expect(trace.networkCalls[0].url).toBe('https://httpbin.org/get');
    });

    it('detects superagent calls', () => {
      const code = `superagent.post('https://api.example.com/submit');`;
      const trace = analyzeTrace(code);
      expect(trace.networkCalls).toHaveLength(1);
      expect(trace.networkCalls[0].method).toBe('POST');
      expect(trace.networkCalls[0].url).toBe('https://api.example.com/submit');
    });

    it('detects new URL() with string literal', () => {
      const code = `const url = new URL('https://example.com/path');`;
      const trace = analyzeTrace(code);
      expect(trace.networkCalls).toHaveLength(1);
      expect(trace.networkCalls[0].url).toBe('https://example.com/path');
    });

    it('tracks correct line numbers', () => {
      const code = [
        `const a = 1;`,
        `const b = 2;`,
        `fetch('https://api.example.com/line3');`,
      ].join('\n');
      const trace = analyzeTrace(code);
      expect(trace.networkCalls[0].line).toBe(3);
    });
  });

  describe('envAccess', () => {
    it('detects process.env.KEY_NAME', () => {
      const code = `const key = process.env.API_KEY;`;
      const trace = analyzeTrace(code);
      expect(trace.envAccess).toEqual(['API_KEY']);
    });

    it('detects process.env["KEY"] bracket notation', () => {
      const code = `const secret = process.env['DB_PASSWORD'];`;
      const trace = analyzeTrace(code);
      expect(trace.envAccess).toEqual(['DB_PASSWORD']);
    });

    it('detects Deno.env.get()', () => {
      const code = `const token = Deno.env.get('AUTH_TOKEN');`;
      const trace = analyzeTrace(code);
      expect(trace.envAccess).toEqual(['AUTH_TOKEN']);
    });

    it('detects multiple env accesses', () => {
      const code = [
        `const a = process.env.KEY_A;`,
        `const b = process.env['KEY_B'];`,
      ].join('\n');
      const trace = analyzeTrace(code);
      expect(trace.envAccess).toHaveLength(2);
      expect(trace.envAccess).toContain('KEY_A');
      expect(trace.envAccess).toContain('KEY_B');
    });
  });

  describe('fsOperations', () => {
    it('detects fs.readFileSync as read', () => {
      const code = `const data = fs.readFileSync('/etc/passwd');`;
      const trace = analyzeTrace(code);
      expect(trace.fsOperations).toHaveLength(1);
      expect(trace.fsOperations[0]).toEqual({
        operation: 'read',
        path: '/etc/passwd',
        line: 1,
      });
    });

    it('detects fs.writeFileSync as write', () => {
      const code = `fs.writeFileSync('/tmp/out.txt');`;
      const trace = analyzeTrace(code);
      expect(trace.fsOperations[0].operation).toBe('write');
    });

    it('detects fs.unlinkSync as delete', () => {
      const code = `fs.unlinkSync('/tmp/secret.txt');`;
      const trace = analyzeTrace(code);
      expect(trace.fsOperations[0].operation).toBe('delete');
    });

    it('detects async fs methods', () => {
      const code = [
        `fs.readFile('/data/input.json');`,
        `fs.writeFile('/data/output.json');`,
        `fs.unlink('/data/temp.json');`,
      ].join('\n');
      const trace = analyzeTrace(code);
      expect(trace.fsOperations).toHaveLength(3);
      expect(trace.fsOperations[0].operation).toBe('read');
      expect(trace.fsOperations[1].operation).toBe('write');
      expect(trace.fsOperations[2].operation).toBe('delete');
    });

    it('detects createReadStream and createWriteStream', () => {
      const code = [
        `fs.createReadStream('/data/big.csv');`,
        `fs.createWriteStream('/data/out.csv');`,
      ].join('\n');
      const trace = analyzeTrace(code);
      expect(trace.fsOperations).toHaveLength(2);
      expect(trace.fsOperations[0].operation).toBe('read');
      expect(trace.fsOperations[1].operation).toBe('write');
    });
  });

  describe('processSpawns', () => {
    it('detects exec()', () => {
      const code = `exec('ls -la');`;
      const trace = analyzeTrace(code);
      expect(trace.processSpawns).toEqual(['ls -la']);
    });

    it('detects execSync()', () => {
      const code = `execSync('rm -rf /');`;
      const trace = analyzeTrace(code);
      expect(trace.processSpawns).toEqual(['rm -rf /']);
    });

    it('detects spawn()', () => {
      const code = `spawn('node');`;
      const trace = analyzeTrace(code);
      expect(trace.processSpawns).toEqual(['node']);
    });

    it('detects child_process prefixed calls', () => {
      const code = `child_process.fork('worker.js');`;
      const trace = analyzeTrace(code);
      expect(trace.processSpawns).toEqual(['worker.js']);
    });
  });

  describe('dynamicEval', () => {
    it('detects eval()', () => {
      const code = `eval('console.log(1)');`;
      const trace = analyzeTrace(code);
      expect(trace.dynamicEval).toHaveLength(1);
      expect(trace.dynamicEval[0]).toContain('eval(');
    });

    it('detects new Function()', () => {
      const code = `const fn = new Function('return 1');`;
      const trace = analyzeTrace(code);
      expect(trace.dynamicEval).toHaveLength(1);
      expect(trace.dynamicEval[0]).toContain('new Function(');
    });

    it('detects vm.runInContext', () => {
      const code = `vm.runInContext('code', ctx);`;
      const trace = analyzeTrace(code);
      expect(trace.dynamicEval).toHaveLength(1);
    });

    it('detects vm.createScript', () => {
      const code = `vm.createScript('code');`;
      const trace = analyzeTrace(code);
      expect(trace.dynamicEval).toHaveLength(1);
    });
  });

  describe('comment skipping', () => {
    it('skips single-line comments', () => {
      const code = `// fetch('https://example.com')`;
      const trace = analyzeTrace(code);
      expect(trace.networkCalls).toHaveLength(0);
    });

    it('skips block comments', () => {
      const code = [
        `/*`,
        `fetch('https://example.com')`,
        `*/`,
        `const x = 1;`,
      ].join('\n');
      const trace = analyzeTrace(code);
      expect(trace.networkCalls).toHaveLength(0);
    });

    it('does not skip code after block comment ends', () => {
      const code = [
        `/*`,
        `commented out`,
        `*/`,
        `fetch('https://example.com/real');`,
      ].join('\n');
      const trace = analyzeTrace(code);
      expect(trace.networkCalls).toHaveLength(1);
      expect(trace.networkCalls[0].url).toBe('https://example.com/real');
    });
  });

  describe('edge cases', () => {
    it('returns empty arrays for clean code', () => {
      const code = `const x = 1;\nconst y = x + 2;\nconsole.log(y);`;
      const trace = analyzeTrace(code);
      expect(trace.networkCalls).toHaveLength(0);
      expect(trace.envAccess).toHaveLength(0);
      expect(trace.fsOperations).toHaveLength(0);
      expect(trace.processSpawns).toHaveLength(0);
      expect(trace.dynamicEval).toHaveLength(0);
    });

    it('handles empty source code', () => {
      const trace = analyzeTrace('');
      expect(trace.networkCalls).toHaveLength(0);
      expect(trace.envAccess).toHaveLength(0);
      expect(trace.fsOperations).toHaveLength(0);
      expect(trace.processSpawns).toHaveLength(0);
      expect(trace.dynamicEval).toHaveLength(0);
    });

    it('detects mixed categories in same code', () => {
      const code = [
        `const data = fetch('https://api.example.com/data');`,
        `const key = process.env.API_KEY;`,
        `fs.writeFileSync('/tmp/out.txt');`,
        `exec('whoami');`,
        `eval('1+1');`,
      ].join('\n');
      const trace = analyzeTrace(code);
      expect(trace.networkCalls).toHaveLength(1);
      expect(trace.envAccess).toHaveLength(1);
      expect(trace.fsOperations).toHaveLength(1);
      expect(trace.processSpawns).toHaveLength(1);
      expect(trace.dynamicEval).toHaveLength(1);
    });
  });
});
