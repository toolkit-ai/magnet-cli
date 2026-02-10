#!/usr/bin/env node
const path = require('path');
const { spawnSync } = require('child_process');

const binDir = path.join(__dirname, '..', 'bin');
const binary = path.join(binDir, process.platform === 'win32' ? 'magnet.exe' : 'magnet');

const result = spawnSync(binary, process.argv.slice(2), {
  stdio: 'inherit',
  windowsHide: true,
});
process.exit(result.status !== null ? result.status : 1);
