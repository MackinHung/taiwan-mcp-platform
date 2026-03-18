import type { AlertRecord, Env } from './types.js';

const NCDR_BASE = 'https://alerts.ncdr.nat.gov.tw/api';

export function buildAlertUrl(
  endpoint: string,
  params?: { apiKey?: string }
): string {
  const url = new URL(`${NCDR_BASE}/${endpoint}`);
  if (params?.apiKey) {
    url.searchParams.set('api_key', params.apiKey);
  }
  return url.toString();
}

function normalizeAlert(raw: Record<string, unknown>): AlertRecord {
  const r: AlertRecord = {};
  r.alertId = String(raw['AlertID'] ?? raw['alertId'] ?? raw['id'] ?? '');
  r.alertType = String(
    raw['AlertType'] ?? raw['alertType'] ?? raw['type'] ?? raw['disaster_type'] ?? ''
  );
  r.alertTypeName = String(
    raw['AlertTypeName'] ?? raw['alertTypeName'] ?? raw['type_name'] ?? ''
  );
  r.severity = String(
    raw['Severity'] ?? raw['severity'] ?? raw['level'] ?? ''
  );
  r.area = String(
    raw['Area'] ?? raw['area'] ?? raw['location'] ?? raw['affected_area'] ?? ''
  );
  r.description = String(
    raw['Description'] ?? raw['description'] ?? raw['content'] ?? raw['headline'] ?? ''
  );
  r.sender = String(
    raw['Sender'] ?? raw['sender'] ?? raw['source'] ?? ''
  );
  r.effective = String(
    raw['Effective'] ?? raw['effective'] ?? raw['onset'] ?? raw['start_time'] ?? ''
  );
  r.expires = String(
    raw['Expires'] ?? raw['expires'] ?? raw['end_time'] ?? ''
  );
  r.updateTime = String(
    raw['UpdateTime'] ?? raw['updateTime'] ?? raw['update_time'] ?? raw['sent'] ?? ''
  );
  r.magnitude = String(
    raw['Magnitude'] ?? raw['magnitude'] ?? raw['scale'] ?? ''
  );
  r.depth = String(
    raw['Depth'] ?? raw['depth'] ?? ''
  );
  r.epicenter = String(
    raw['Epicenter'] ?? raw['epicenter'] ?? raw['location_name'] ?? ''
  );
  return r;
}

export async function fetchAlerts(
  env: Env,
  endpoint: string
): Promise<{ alerts: AlertRecord[]; total: number }> {
  const url = buildAlertUrl(endpoint, { apiKey: env.NCDR_API_KEY });
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`NCDR API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as unknown;

  // Array response
  if (Array.isArray(data)) {
    const alerts = data.map((item) =>
      normalizeAlert(item as Record<string, unknown>)
    );
    return { alerts, total: alerts.length };
  }

  // Object with records/alerts/data array
  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>;
    const items =
      (obj.records as unknown[]) ??
      (obj.alerts as unknown[]) ??
      (obj.data as unknown[]) ??
      (obj.result as unknown[]);

    if (Array.isArray(items)) {
      const alerts = items.map((item) =>
        normalizeAlert(item as Record<string, unknown>)
      );
      return {
        alerts,
        total: (obj.total as number) ?? alerts.length,
      };
    }
  }

  throw new Error('NCDR API returned unexpected response format');
}

export async function fetchAllAlerts(
  env: Env
): Promise<{ alerts: AlertRecord[]; total: number }> {
  return fetchAlerts(env, 'AlertAll');
}
