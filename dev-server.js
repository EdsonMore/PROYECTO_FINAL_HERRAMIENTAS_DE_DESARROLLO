#!/usr/bin/env node
process.env.HOST = '127.0.0.1';
process.env.PORT = '3000';
process.env.NODE_ENV = 'development';

const { execFile } = require('child_process');
const path = require('path');

const proc = execFile('npx', ['pnpm', 'dev', '--hostname', '127.0.0.1', '--port', '3000'], {
  cwd: __dirname,
  stdio: 'inherit',
  env: {
    ...process.env,
    HOST: '127.0.0.1',
    PORT: '3000',
  },
});

proc.on('error', (err) => {
  console.error('Error:', err);
  process.exit(1);
});
