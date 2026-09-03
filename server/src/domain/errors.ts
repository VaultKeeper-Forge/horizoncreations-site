export class CommerceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode = 400,
    public readonly details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "CommerceError";
  }
}

export const forbidden = (code: string, message: string, details: Record<string, unknown> = {}) =>
  new CommerceError(code, message, 403, details);

export const notFound = (code: string, message: string, details: Record<string, unknown> = {}) =>
  new CommerceError(code, message, 404, details);
