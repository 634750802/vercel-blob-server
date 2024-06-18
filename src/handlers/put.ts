import path from 'node:path';
import * as URL from 'node:url';
import { defineHandler, storePath } from './common.ts';

export default defineHandler({
  name: 'put',
  test (url: URL, request: Request): boolean {
    return request.method === 'PUT' && !url.searchParams.has('fromUrl');
  },
  async handle (url: URL, request) {
    const contentDisposition = request.headers.get('Content-Disposition') || 'attachment';
    const blob = await request.blob();
    const contentType = blob.type || request.headers.get('X-Content-Type');
    const cacheControlRaw = request.headers.get('x-cache-control-max-age');
    let cacheControl: string | undefined;
    if (cacheControlRaw) {
      cacheControl = `max-age=${cacheControlRaw}`;
    }

    const data = {
      url: url.pathname,
      downloadUrl: url,
      pathname: url.pathname,
      size: blob.size,
      contentType,
      cacheControl,
      uploadedAt: new Date(),
      contentDisposition,
    };

    await Bun.write(path.join(storePath, url.pathname), blob, { createPath: true });
    await Bun.write(path.join(storePath, url.pathname + '._vercel_mock_meta_'), JSON.stringify(data, undefined, 2), { createPath: true });

    return Response.json({
      url: url,
      downloadUrl: url,
      pathname: url.pathname,
      contentType,
      contentDisposition,
    });
  },
});