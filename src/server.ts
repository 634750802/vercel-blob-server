import type { Handler } from './handlers/common.ts';
import copy from './handlers/copy.ts';
import get from './handlers/get.ts';
import del from './handlers/del.ts';
import head from './handlers/head.ts';
import put from './handlers/put.ts';

const handlers: Handler[] = [head, get, copy, put, del];

Bun.serve({
  port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  fetch: async (request) => {
    try {
      const url = new URL(request.url);
      for (let handler of handlers) {
        if (handler.test(url, request)) {
          return handler.handle(url, request);
        }
      }

      return Response.json(null, { status: 404 });
    } catch (e) {
      console.error(e);
      return new Response(String((e as any)?.message ?? e), { status: 500 });
    }
  },
});
