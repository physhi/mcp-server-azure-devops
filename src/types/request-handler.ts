import { IncomingMessage } from 'http';

export interface RequestHandler {
  /**
   * Identify if this handler can handle the given request
   */
  match: (
    request: IncomingMessage,
    parsedUrl: URL,
  ) => boolean | Promise<boolean>;

  /**
   * Handle the request and return a response
   */
  handle: (
    request: IncomingMessage,
    params: unknown,
  ) => Promise<{
    status: number;
    body: unknown;
    headers?: Record<string, string>;
  }>;
}
