/**
 * VirusTotal Integration
 * Scans source code via VirusTotal API for malware detection.
 * Free tier: 4 req/min, 500/day — sufficient for 39 servers.
 */

export interface VtScanResult {
  status: 'clean' | 'suspicious' | 'malicious' | 'skipped';
  detections: number;
  totalEngines: number;
  details: string;
}

const VT_API_URL = 'https://www.virustotal.com/api/v3';
const VT_POLL_INTERVAL_MS = 15000;  // 15 seconds between polls
const VT_TIMEOUT_MS = 60000;        // 60 second total timeout

/**
 * Upload source code to VirusTotal for scanning.
 * Returns analysis ID or null on failure.
 */
async function uploadToVt(sourceCode: string, apiKey: string): Promise<string | null> {
  const blob = new Blob([sourceCode], { type: 'text/plain' });
  const formData = new FormData();
  formData.append('file', blob, 'source.ts');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`${VT_API_URL}/files`, {
      method: 'POST',
      headers: { 'x-apikey': apiKey },
      body: formData,
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error(`VT upload error: ${response.status}`);
      return null;
    }

    const data = await response.json() as { data?: { id?: string } };
    return data.data?.id ?? null;
  } catch (error) {
    console.error('VT upload failed:', error);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Poll VirusTotal for analysis results.
 */
async function pollVtResults(
  analysisId: string,
  apiKey: string
): Promise<{ malicious: number; suspicious: number; total: number } | null> {
  const deadline = Date.now() + VT_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(`${VT_API_URL}/analyses/${analysisId}`, {
        headers: { 'x-apikey': apiKey },
        signal: controller.signal,
      });

      if (!response.ok) {
        clearTimeout(timeoutId);
        return null;
      }

      const data = await response.json() as {
        data?: {
          attributes?: {
            status?: string;
            stats?: {
              malicious?: number;
              suspicious?: number;
              undetected?: number;
              harmless?: number;
            };
          };
        };
      };

      const attrs = data.data?.attributes;
      if (attrs?.status === 'completed' && attrs.stats) {
        clearTimeout(timeoutId);
        const stats = attrs.stats;
        const total = (stats.malicious || 0) + (stats.suspicious || 0)
          + (stats.undetected || 0) + (stats.harmless || 0);
        return {
          malicious: stats.malicious || 0,
          suspicious: stats.suspicious || 0,
          total,
        };
      }

      clearTimeout(timeoutId);
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, VT_POLL_INTERVAL_MS));
    } catch {
      clearTimeout(timeoutId);
      return null;
    }
  }

  return null; // Timeout
}

/**
 * Scan source code with VirusTotal.
 * Gracefully degrades: no API key → skipped, errors → skipped.
 */
export async function scanWithVirusTotal(
  sourceCode: string,
  apiKey: string | undefined
): Promise<VtScanResult> {
  if (!apiKey) {
    return { status: 'skipped', detections: 0, totalEngines: 0, details: 'No VirusTotal API key configured' };
  }

  if (!sourceCode || sourceCode.trim().length === 0) {
    return { status: 'skipped', detections: 0, totalEngines: 0, details: 'Empty source code' };
  }

  const analysisId = await uploadToVt(sourceCode, apiKey);
  if (!analysisId) {
    return { status: 'skipped', detections: 0, totalEngines: 0, details: 'Failed to upload to VirusTotal' };
  }

  const results = await pollVtResults(analysisId, apiKey);
  if (!results) {
    return { status: 'skipped', detections: 0, totalEngines: 0, details: 'VirusTotal analysis timed out' };
  }

  const totalDetections = results.malicious + results.suspicious;

  if (results.malicious > 0) {
    return {
      status: 'malicious',
      detections: totalDetections,
      totalEngines: results.total,
      details: `${results.malicious} engine(s) flagged as malicious, ${results.suspicious} suspicious`,
    };
  }

  if (results.suspicious > 0) {
    return {
      status: 'suspicious',
      detections: totalDetections,
      totalEngines: results.total,
      details: `${results.suspicious} engine(s) flagged as suspicious`,
    };
  }

  return {
    status: 'clean',
    detections: 0,
    totalEngines: results.total,
    details: `Scanned by ${results.total} engines, no detections`,
  };
}
