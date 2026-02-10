#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

const binDir = path.join(__dirname, '..', 'bin');
const binary = path.join(binDir, process.platform === 'win32' ? 'magnet.exe' : 'magnet');

if (!fs.existsSync(binary)) {
  console.info('magnet: Downloading binary...');
  const download = spawnSync(process.execPath, [path.join(__dirname, 'download.js')], {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
  });
  if (download.status !== 0) {
    console.error('magnet: download failed. Ensure a GitHub Release exists (e.g. tag v0.1.0).');
    process.exit(1);
  }
  if (!fs.existsSync(binary)) {
    console.error('magnet: binary still missing after download.');
    process.exit(1);
  }
}

const result = spawnSync(binary, process.argv.slice(2), {
  stdio: 'inherit',
  windowsHide: true,
});
process.exit(result.status !== null ? result.status : 1);
