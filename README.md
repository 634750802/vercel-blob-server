# Vercel blob server

> Mocking a vercel blob server **_ONLY FOR LOCAL DEVELOPMENT_**.

The code is **NOT TESTED**, contributions are welcome.

Supported API:

- `get`
- `head`
- `put`
- `copy`
- `del`

## Run with docker compose

Create docker image locally.

```shell
$ pnpm i
$ pnpm run build
$ pnpm run build:docker
```

Add container config to your docker compose

- volume: `/var/vercel-blob-store` stores all uploaded file and meta info.
- port: `3000`: container http server port

```yaml
vercel-blob-server:
  ports:
    - '9966:3000'
  image: vercel-blob-server
  volumes:
    - ./dev/vercel-blob-store:/var/vercel-blob-store
```

## Usage

Edit your .env.local

```dotenv
# This env cheats @vercel/blob's internal pre checks
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_somefakeid_nonce
# This port should be same to your mapped port
VERCEL_BLOB_API_URL=http://localhost:9966
```

Just use `@vercel/blob` as before
