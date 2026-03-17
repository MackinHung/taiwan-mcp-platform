import { describe, it, expect } from 'vitest';
import { AppError, Errors } from '../errors.js';

describe('AppError', () => {
  it('creates with code, message, status', () => {
    const err = new AppError('TEST_ERROR', 'Something went wrong', 400);
    expect(err.code).toBe('TEST_ERROR');
    expect(err.message).toBe('Something went wrong');
    expect(err.status).toBe(400);
    expect(err.name).toBe('AppError');
  });

  it('creates with optional details', () => {
    const details = { field: 'email', issue: 'invalid' };
    const err = new AppError('VALIDATION', 'Bad input', 400, details);
    expect(err.details).toEqual(details);
  });

  it('is an instance of Error', () => {
    const err = new AppError('TEST', 'test', 500);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
  });

  it('toJSON returns correct format', () => {
    const err = new AppError('TEST_ERROR', 'Something wrong', 400, { field: 'name' });
    const json = err.toJSON();
    expect(json).toEqual({
      success: false,
      error: {
        code: 'TEST_ERROR',
        message: 'Something wrong',
        details: { field: 'name' },
      },
      data: null,
    });
  });

  it('toJSON without details omits details as undefined', () => {
    const err = new AppError('TEST', 'msg', 500);
    const json = err.toJSON();
    expect(json.error.details).toBeUndefined();
  });
});

describe('Errors factory functions', () => {
  it('UNAUTHORIZED creates 401 error', () => {
    const err = Errors.UNAUTHORIZED();
    expect(err).toBeInstanceOf(AppError);
    expect(err.code).toBe('UNAUTHORIZED');
    expect(err.status).toBe(401);
    expect(err.message).toBe('未授權，請先登入');
  });

  it('FORBIDDEN creates 403 error', () => {
    const err = Errors.FORBIDDEN();
    expect(err).toBeInstanceOf(AppError);
    expect(err.code).toBe('FORBIDDEN');
    expect(err.status).toBe(403);
    expect(err.message).toBe('權限不足');
  });

  it('NOT_FOUND creates 404 error with default resource', () => {
    const err = Errors.NOT_FOUND();
    expect(err.code).toBe('NOT_FOUND');
    expect(err.status).toBe(404);
    expect(err.message).toBe('資源不存在');
  });

  it('NOT_FOUND creates 404 error with custom resource', () => {
    const err = Errors.NOT_FOUND('伺服器');
    expect(err.message).toBe('伺服器不存在');
  });

  it('RATE_LIMITED creates 429 error', () => {
    const err = Errors.RATE_LIMITED();
    expect(err.code).toBe('RATE_LIMITED');
    expect(err.status).toBe(429);
    expect(err.message).toBe('請求過於頻繁，請稍後再試');
  });

  it('PAYMENT_REQUIRED creates 402 error', () => {
    const err = Errors.PAYMENT_REQUIRED();
    expect(err.code).toBe('PAYMENT_REQUIRED');
    expect(err.status).toBe(402);
    expect(err.message).toBe('已達用量上限，請升級方案');
  });

  it('VALIDATION_ERROR creates 400 error with details', () => {
    const details = [{ field: 'slug', message: 'required' }];
    const err = Errors.VALIDATION_ERROR(details);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.status).toBe(400);
    expect(err.details).toEqual(details);
  });

  it('INTERNAL_ERROR creates 500 error', () => {
    const err = Errors.INTERNAL_ERROR();
    expect(err.code).toBe('INTERNAL_ERROR');
    expect(err.status).toBe(500);
    expect(err.message).toBe('系統內部錯誤');
  });

  it('CONFLICT creates 409 error with custom message', () => {
    const err = Errors.CONFLICT('Slug already exists');
    expect(err.code).toBe('CONFLICT');
    expect(err.status).toBe(409);
    expect(err.message).toBe('Slug already exists');
  });

  it('each factory creates a new instance each time', () => {
    const err1 = Errors.UNAUTHORIZED();
    const err2 = Errors.UNAUTHORIZED();
    expect(err1).not.toBe(err2);
  });
});
