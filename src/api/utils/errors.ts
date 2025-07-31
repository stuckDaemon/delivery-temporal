export class ApiError extends Error {
  statusCode: number;
  cause?: unknown;

  constructor(statusCode: number, message: string, cause?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.cause = cause;
    this.name = 'ApiError';
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export function handleError(err: unknown, res: any): void {
  if (err instanceof ApiError) {
    console.error(`[API Error] ${err.statusCode} - ${err.message}`, err.cause || '');
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Handle validation errors (example: Zod)
  if (err instanceof Error && 'issues' in err) {
    console.error('[Validation Error]', err);
    return res.status(400).json({ error: err.message });
  }

  // Handle Sequelize errors (example)
  if (err instanceof Error && err.name.startsWith('Sequelize')) {
    console.error('[Database Error]', err);
    return res.status(500).json({ error: 'Database error' });
  }

  console.error('[Unexpected Error]', err);
  res.status(500).json({ error: 'Internal server error' });
}
