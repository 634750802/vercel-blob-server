FROM oven/bun:1 as base

RUN mkdir /app

ENV VERCEL_STORE_PATH /var/vercel-blob-store

COPY ./dist/server.js /app

EXPOSE 3000
CMD [ "bun", "/app/server.js" ]
