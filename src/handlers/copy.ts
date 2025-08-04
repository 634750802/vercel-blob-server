import fs from 'node:fs/promises';
import path from 'node:path';
import { defineHandler, storePath } from './common.ts';

export default defineHandler({
  name: 'copy',
  test (url: URL, request: Request): boolean {
    return request.method === 'PUT' && url.searchParams.has('fromUrl');
  },
  async handle (url: URL, request) {
    // Copy
    const fromPath = url.searchParams.get('fromUrl')!;
    const metaFile = Bun.file(path.join(storePath, fromPath + '._vercel_mock_meta_'));
    const file = Bun.file(path.join(storePath, fromPath));
    if (await metaFile.exists() && await file.exists()) {
      const meta = await metaFile.json();
      meta.url = new URL(url.pathname, url.origin).toString();
      meta.downloadUrl = new URL(url.pathname + '?download=1', url.origin).toString();
      meta.pathname = url.pathname;
      meta.uploadedAt = new Date();
      await fs.mkdir(path.dirname(path.join(storePath, url.pathname)), { recursive: true });
      await Bun.write(path.join(storePath, url.pathname + '._vercel_mock_meta_'), JSON.stringify(meta, undefined, 2));
      await fs.cp(path.join(storePath, fromPath), path.join(storePath, url.pathname));

      return Response.json(meta);
    } else {
      return new Response(null, { status: 404 });
    }
  },
});