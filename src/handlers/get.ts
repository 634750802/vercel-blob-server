import path from 'node:path';
import { defineHandler, storePath } from './common.ts';

export default defineHandler({
  name: 'get',
  test (url, request) {
    return (request.method === 'GET') && !url.searchParams.has('url');
  },
  async handle (url, request) {
    const isDownload = url.searchParams.get('download') === '1';
    const metaFile = Bun.file(path.join(storePath, url.pathname + '._vercel_mock_meta_'));
    const file = Bun.file(path.join(storePath, url.pathname));
    if (await metaFile.exists() && await file.exists()) {
      const data = await metaFile.json();
      const headers = new Headers({
        'Content-Type': data.contentType,
        'Content-Length': String(data.size),
        'Cache-Control': data.cacheControl,
        'Last-Modified': String(new Date(data.uploadedAt)),
      });
      if (isDownload) {
        headers.set('Content-Disposition', data.contentDisposition);
      }
      return new Response(file, { headers });
    } else {
      return new Response(null, { status: 404 });
    }
  },
});
