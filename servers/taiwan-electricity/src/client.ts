import type { GenerationResponse, GenerationUnit, PowerOverview } from './types.js';

const GENERATION_URL =
  'https://service.taipower.com.tw/data/opendata/apply/file/d006001/001.json';
const LOAD_URL =
  'https://www.taipower.com.tw/d006/loadGraph/loadGraph/data/loadpara.txt';

function parseCommaNumber(s: string): number {
  return parseFloat(s.replace(/,/g, ''));
}

export async function fetchGenerationData(): Promise<{
  dateTime: string;
  units: GenerationUnit[];
}> {
  const response = await fetch(GENERATION_URL);
  if (!response.ok) {
    throw new Error(`Taipower generation API error: ${response.status}`);
  }
  const data = (await response.json()) as GenerationResponse;
  return {
    dateTime: data.DateTime ?? '',
    units: data.aaData ?? [],
  };
}

export function parseLoadParaText(text: string): PowerOverview {
  const loadInfoMatch = text.match(
    /var\s+loadInfo\s*=\s*\[\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"\s*\]/
  );
  const loadInfoYdayMatch = text.match(
    /var\s+loadInfoYday\s*=\s*\[\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"\s*\]/
  );

  if (!loadInfoMatch) {
    throw new Error('Failed to parse loadInfo from Taipower data');
  }

  const currentLoad = parseCommaNumber(loadInfoMatch[1]);
  const supplyCapacity = parseCommaNumber(loadInfoMatch[2]);
  const peakCapacity = parseCommaNumber(loadInfoMatch[3]);
  const updateTime = loadInfoMatch[4];
  const reserveRate =
    currentLoad > 0
      ? Math.round(((supplyCapacity - currentLoad) / supplyCapacity) * 10000) /
        100
      : 0;

  const yesterdayPeakLoad = loadInfoYdayMatch
    ? parseCommaNumber(loadInfoYdayMatch[1])
    : 0;
  const yesterdaySupply = loadInfoYdayMatch
    ? parseCommaNumber(loadInfoYdayMatch[2])
    : 0;
  const yesterdayReserveRate = loadInfoYdayMatch
    ? parseFloat(loadInfoYdayMatch[3])
    : 0;
  const yesterdayDate = loadInfoYdayMatch ? loadInfoYdayMatch[4] : '';

  return {
    currentLoad,
    supplyCapacity,
    peakCapacity,
    updateTime,
    reserveRate,
    yesterdayPeakLoad,
    yesterdaySupply,
    yesterdayReserveRate,
    yesterdayDate,
  };
}

export async function fetchPowerOverview(): Promise<PowerOverview> {
  const response = await fetch(LOAD_URL);
  if (!response.ok) {
    throw new Error(`Taipower load API error: ${response.status}`);
  }
  const text = await response.text();
  return parseLoadParaText(text);
}
