const result = await Bun.build({
  entrypoints: ['src/server.ts'],
  target: 'bun',
  outdir: 'dist',
});

if (!result.success) {
  for (let message of result.logs) {
    console.error(`${message.level} ${message.name}`);
  }
  process.exit(0);
}
