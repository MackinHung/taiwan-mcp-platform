export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
      data: null,
    };
  }
}

export const Errors = {
  UNAUTHORIZED: () => new AppError('UNAUTHORIZED', '未授權，請先登入', 401),
  FORBIDDEN: () => new AppError('FORBIDDEN', '權限不足', 403),
  NOT_FOUND: (resource = '資源') => new AppError('NOT_FOUND', `${resource}不存在`, 404),
  RATE_LIMITED: () => new AppError('RATE_LIMITED', '請求過於頻繁，請稍後再試', 429),
  PAYMENT_REQUIRED: () => new AppError('PAYMENT_REQUIRED', '已達用量上限，請升級方案', 402),
  VALIDATION_ERROR: (details: unknown) => new AppError('VALIDATION_ERROR', '輸入驗證失敗', 400, details),
  INTERNAL_ERROR: () => new AppError('INTERNAL_ERROR', '系統內部錯誤', 500),
  CONFLICT: (message: string) => new AppError('CONFLICT', message, 409),
} as const;
