import path from 'node:path';
import { unlink } from 'node:fs/promises';
import { defineHandler, storePath } from './common.ts';

export default defineHandler({
  name: 'del',

  test(requestUrl, request) {
    return request.method === 'POST' && requestUrl.pathname === '/delete';
  },

  async handle(requestUrl, request) {
    const body = await request.json();

    const urlsArray = body.urls;

    if (urlsArray.length) {
      for (let url of urlsArray) {
        const formattedUrl = url.replace(requestUrl.origin + '/', '');

        const file = Bun.file(path.join(storePath, formattedUrl));
        const isExists = await file.exists();

        if (isExists) {
          await unlink(path.join(storePath, formattedUrl));
          await unlink(
            path.join(storePath, formattedUrl + '._vercel_mock_meta_')
          );
          console.log(path.join(storePath, formattedUrl));
        } else {
          console.log('file not exists', formattedUrl);
        }
      }
    }
    return Response.json(null, { status: 200 });
  },
});
