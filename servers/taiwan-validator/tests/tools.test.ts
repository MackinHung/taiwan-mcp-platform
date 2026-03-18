import { describe, it, expect } from 'vitest';
import { validateNationalId } from '../src/tools/national-id.js';
import { validateTaxId } from '../src/tools/tax-id.js';
import { validatePhone } from '../src/tools/phone.js';
import { validateBankAccount } from '../src/tools/bank-account.js';
import { validateLicensePlate } from '../src/tools/license-plate.js';
import type { Env } from '../src/types.js';

const env: Env = {
  SERVER_NAME: 'taiwan-validator',
  SERVER_VERSION: '1.0.0',
};

// --- National ID ---
describe('validateNationalId', () => {
  it('validates a correct national ID (A123456789)', async () => {
    const result = await validateNationalId(env, { id: 'A123456789' });
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.valid).toBe(true);
    expect(parsed.breakdown.city).toBe('台北市');
    expect(parsed.breakdown.gender).toBe('男');
  });

  it('validates a female national ID', async () => {
    // F229889862 is a valid ID
    const result = await validateNationalId(env, { id: 'F229889862' });
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.breakdown.gender).toBe('女');
    expect(parsed.breakdown.city).toBe('新北市');
  });

  it('rejects invalid checksum', async () => {
    const result = await validateNationalId(env, { id: 'A123456780' });
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.valid).toBe(false);
    expect(parsed.message).toContain('驗證失敗');
  });

  it('rejects wrong format (too short)', async () => {
    const result = await validateNationalId(env, { id: 'A12345' });
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.valid).toBe(false);
    expect(parsed.message).toContain('格式錯誤');
  });

  it('rejects all-digit input', async () => {
    const result = await validateNationalId(env, { id: '1234567890' });
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.valid).toBe(false);
  });

  it('handles lowercase input by converting to uppercase', async () => {
    const result = await validateNationalId(env, { id: 'a123456789' });
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.valid).toBe(true);
    expect(parsed.input).toBe('A123456789');
  });

  it('returns error when id is empty', async () => {
    const result = await validateNationalId(env, { id: '' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供身分證字號');
  });

  it('returns error when id is missing', async () => {
    const result = await validateNationalId(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供身分證字號');
  });

  it('handles whitespace in input', async () => {
    const result = await validateNationalId(env, { id: '  A123456789  ' });
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.valid).toBe(true);
  });
});

// --- Tax ID ---
describe('validateTaxId', () => {
  it('validates a correct tax ID (04595257 — Google Taiwan)', async () => {
    const result = await validateTaxId(env, { taxId: '04595257' });
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.valid).toBe(true);
    expect(parsed.message).toContain('驗證通過');
  });

  it('validates tax ID with 7th digit = 7 (special rule)', async () => {
    // 10458575 — 7th digit is 7
    const result = await validateTaxId(env, { taxId: '10458575' });
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.breakdown.seventhDigitIs7).toBe(true);
  });

  it('rejects invalid tax ID', async () => {
    const result = await validateTaxId(env, { taxId: '00000001' });
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.valid).toBe(false);
    expect(parsed.message).toContain('驗證失敗');
  });

  it('rejects wrong format (not 8 digits)', async () => {
    const result = await validateTaxId(env, { taxId: '12345' });
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.valid).toBe(false);
    expect(parsed.message).toContain('格式錯誤');
  });

  it('rejects non-numeric input', async () => {
    const result = await validateTaxId(env, { taxId: 'ABCDEFGH' });
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.valid).toBe(false);
  });

  it('returns error when taxId is empty', async () => {
    const result = await validateTaxId(env, { taxId: '' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供統一編號');
  });

  it('returns error when taxId is missing', async () => {
    const result = await validateTaxId(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供統一編號');
  });
});

// --- Phone ---
describe('validatePhone', () => {
  it('validates a correct phone number (0912345678)', async () => {
    const result = await validatePhone(env, { phone: '0912345678' });
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.valid).toBe(true);
    expect(parsed.breakdown.carrier).toBe('中華電信');
  });

  it('identifies 遠傳電信 carrier (0928)', async () => {
    const result = await validatePhone(env, { phone: '0928123456' });
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.valid).toBe(true);
    expect(parsed.breakdown.carrier).toBe('遠傳電信');
  });

  it('identifies 台灣大哥大 carrier (0988)', async () => {
    const result = await validatePhone(env, { phone: '0988123456' });
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.valid).toBe(true);
    expect(parsed.breakdown.carrier).toBe('台灣大哥大');
  });

  it('returns formatted number', async () => {
    const result = await validatePhone(env, { phone: '0912345678' });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.breakdown.formatted).toBe('0912-345-678');
  });

  it('strips dashes and spaces', async () => {
    const result = await validatePhone(env, { phone: '0912-345-678' });
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.valid).toBe(true);
  });

  it('rejects wrong format (not starting with 09)', async () => {
    const result = await validatePhone(env, { phone: '0212345678' });
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.valid).toBe(false);
    expect(parsed.message).toContain('格式錯誤');
  });

  it('rejects too short number', async () => {
    const result = await validatePhone(env, { phone: '091234' });
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.valid).toBe(false);
  });

  it('returns error when phone is empty', async () => {
    const result = await validatePhone(env, { phone: '' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供手機號碼');
  });

  it('returns error when phone is missing', async () => {
    const result = await validatePhone(env, {});
    expect(result.isError).toBe(true);
  });

  it('handles unknown carrier prefix', async () => {
    const result = await validatePhone(env, { phone: '0955123456' });
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.valid).toBe(true);
    expect(parsed.breakdown.carrier).toBe('其他/未知業者');
  });
});

// --- Bank Account ---
describe('validateBankAccount', () => {
  it('validates a correct bank account (玉山銀行 808)', async () => {
    const result = await validateBankAccount(env, {
      bankCode: '808',
      accountNumber: '1234567890123',
    });
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.valid).toBe(true);
    expect(parsed.breakdown.bankName).toBe('玉山銀行');
  });

  it('validates 中國信託 (822)', async () => {
    const result = await validateBankAccount(env, {
      bankCode: '822',
      accountNumber: '1234567890123456',
    });
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.valid).toBe(true);
    expect(parsed.breakdown.bankName).toBe('中國信託');
  });

  it('rejects unknown bank code', async () => {
    const result = await validateBankAccount(env, {
      bankCode: '999',
      accountNumber: '1234567890123',
    });
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.valid).toBe(false);
    expect(parsed.message).toContain('非常見銀行代碼');
  });

  it('rejects account number too short', async () => {
    const result = await validateBankAccount(env, {
      bankCode: '808',
      accountNumber: '12345',
    });
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.valid).toBe(false);
    expect(parsed.message).toContain('不在常見範圍');
  });

  it('rejects invalid bank code format', async () => {
    const result = await validateBankAccount(env, {
      bankCode: 'AB',
      accountNumber: '1234567890123',
    });
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.valid).toBe(false);
    expect(parsed.message).toContain('銀行代碼格式錯誤');
  });

  it('rejects non-numeric account number', async () => {
    const result = await validateBankAccount(env, {
      bankCode: '808',
      accountNumber: 'abc12345',
    });
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.valid).toBe(false);
    expect(parsed.message).toContain('帳號格式錯誤');
  });

  it('returns error when bankCode is empty', async () => {
    const result = await validateBankAccount(env, {
      bankCode: '',
      accountNumber: '1234567890123',
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供銀行代碼');
  });

  it('returns error when accountNumber is empty', async () => {
    const result = await validateBankAccount(env, {
      bankCode: '808',
      accountNumber: '',
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供帳號');
  });

  it('returns error when bankCode is missing', async () => {
    const result = await validateBankAccount(env, {
      accountNumber: '1234567890123',
    });
    expect(result.isError).toBe(true);
  });

  it('strips dashes and spaces from account number', async () => {
    const result = await validateBankAccount(env, {
      bankCode: '808',
      accountNumber: '1234-5678-90123',
    });
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.valid).toBe(true);
  });
});

// --- License Plate ---
describe('validateLicensePlate', () => {
  it('validates new-style car/motorcycle plate (ABC-1234)', async () => {
    const result = await validateLicensePlate(env, { plate: 'ABC-1234' });
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.valid).toBe(true);
    expect(parsed.breakdown.vehicleType).toBe('自用車/機車');
  });

  it('validates old-style motorcycle plate (123-ABC)', async () => {
    const result = await validateLicensePlate(env, { plate: '123-ABC' });
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.valid).toBe(true);
    expect(parsed.breakdown.vehicleType).toBe('機車');
  });

  it('validates commercial plate (AB-1234)', async () => {
    const result = await validateLicensePlate(env, { plate: 'AB-1234' });
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.valid).toBe(true);
    expect(parsed.breakdown.vehicleType).toBe('營業用');
  });

  it('validates old-style car plate (1234-AB)', async () => {
    const result = await validateLicensePlate(env, { plate: '1234-AB' });
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.valid).toBe(true);
    expect(parsed.breakdown.vehicleType).toBe('自用車');
  });

  it('normalizes plate without dash (ABC1234 → ABC-1234)', async () => {
    const result = await validateLicensePlate(env, { plate: 'ABC1234' });
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.valid).toBe(true);
    expect(parsed.normalized).toBe('ABC-1234');
  });

  it('handles lowercase plate input', async () => {
    const result = await validateLicensePlate(env, { plate: 'abc-1234' });
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.valid).toBe(true);
  });

  it('rejects invalid plate format', async () => {
    const result = await validateLicensePlate(env, { plate: '12345678' });
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.valid).toBe(false);
    expect(parsed.message).toContain('不符合任何已知');
  });

  it('returns error when plate is empty', async () => {
    const result = await validateLicensePlate(env, { plate: '' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供車牌號碼');
  });

  it('returns error when plate is missing', async () => {
    const result = await validateLicensePlate(env, {});
    expect(result.isError).toBe(true);
  });

  it('shows known formats on invalid plate', async () => {
    const result = await validateLicensePlate(env, { plate: 'X' });
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.knownFormats).toBeDefined();
    expect(parsed.knownFormats.length).toBeGreaterThan(0);
  });
});
