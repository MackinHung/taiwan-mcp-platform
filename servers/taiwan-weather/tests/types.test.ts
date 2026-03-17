import { describe, it, expect } from 'vitest';
import type {
  Env,
  CwaApiResponse,
  ForecastLocation,
  WeatherElement,
  TimeEntry,
  EarthquakeRecord,
  ToolResult,
} from '../src/types.js';

describe('types', () => {
  it('Env has required fields', () => {
    const env: Env = {
      CWA_API_KEY: 'test-key',
      SERVER_NAME: 'taiwan-weather',
      SERVER_VERSION: '1.0.0',
    };
    expect(env.CWA_API_KEY).toBe('test-key');
    expect(env.SERVER_NAME).toBe('taiwan-weather');
    expect(env.SERVER_VERSION).toBe('1.0.0');
  });

  it('CwaApiResponse has correct shape', () => {
    const res: CwaApiResponse<{ data: string }> = {
      success: 'true',
      result: { resource_id: 'test', fields: [] },
      records: { data: 'hello' },
    };
    expect(res.success).toBe('true');
    expect(res.records.data).toBe('hello');
  });

  it('ForecastLocation has locationName and weatherElement', () => {
    const loc: ForecastLocation = {
      locationName: 'Taipei',
      weatherElement: [],
    };
    expect(loc.locationName).toBe('Taipei');
    expect(loc.weatherElement).toEqual([]);
  });

  it('WeatherElement has elementName, description, time', () => {
    const el: WeatherElement = {
      elementName: 'Wx',
      description: 'Weather',
      time: [],
    };
    expect(el.elementName).toBe('Wx');
  });

  it('TimeEntry has startTime, endTime, elementValue', () => {
    const entry: TimeEntry = {
      startTime: '2026-03-17T00:00:00',
      endTime: '2026-03-17T12:00:00',
      elementValue: [{ value: '晴', measures: '自訂' }],
    };
    expect(entry.elementValue[0].value).toBe('晴');
  });

  it('EarthquakeRecord has required nested fields', () => {
    const eq: EarthquakeRecord = {
      EarthquakeNo: 1,
      ReportContent: 'test',
      ReportColor: 'green',
      EarthquakeInfo: {
        OriginTime: '2026-03-17T00:00:00',
        Source: 'CWA',
        FocalDepth: 10,
        EpiCenter: { Location: 'Hualien', EpiCenterLat: 23.5, EpiCenterLon: 121.5 },
        EarthquakeMagnitude: { MagnitudeType: 'ML', MagnitudeValue: 5.0 },
      },
    };
    expect(eq.EarthquakeInfo.EarthquakeMagnitude.MagnitudeValue).toBe(5.0);
  });

  it('ToolResult has content array and optional isError', () => {
    const success: ToolResult = {
      content: [{ type: 'text', text: 'OK' }],
    };
    expect(success.isError).toBeUndefined();

    const failure: ToolResult = {
      content: [{ type: 'text', text: 'fail' }],
      isError: true,
    };
    expect(failure.isError).toBe(true);
  });
});
