export type ErrorCode = 'FORBIDDEN' | 'INVALID_INPUT' | 'NOT_FOUND' | 'CONFLICT' | 'UNAVAILABLE' | 'UNAUTHENTICATED' | 'RATE_LIMITED';

export class ApplicationError extends Error {
  readonly code: ErrorCode;
  constructor(code: ErrorCode, message: string) {
    super(message);
    this.name = 'ApplicationError';
    this.code = code;
  }
}

export async function readOrWrite<T>(operation: () => Promise<T>): Promise<T> {
  try { return await operation(); }
  catch {
    throw new ApplicationError('UNAVAILABLE', 'Não foi possível acessar os registros.');
  }
}
