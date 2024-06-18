export const storePath = process.env.VERCEL_STORE_PATH ?? '.store';

export interface Handler {
  name: string;

  test (url: URL, request: Request): boolean;

  handle (url: URL, request: Request): Response | Promise<Response>;
}

export function defineHandler (handler: Handler) {
  return handler;
}
