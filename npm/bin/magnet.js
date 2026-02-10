#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

const binDir = path.join(__dirname, '..', 'bin');
const binary = path.join(binDir, process.platform === 'win32' ? 'magnet.exe' : 'magnet');

if (!fs.existsSync(binary)) {
  console.error('magnet: binary not found at', binary);
  console.error('Run "npm install -g @magnet-ai/cli" again. If that fails, the postinstall could not download the binary.');
  console.error('Ensure a GitHub Release exists (push a tag like v0.1.0) and the repo has prebuilt binaries.');
  process.exit(1);
}

const result = spawnSync(binary, process.argv.slice(2), {
  stdio: 'inherit',
  windowsHide: true,
});
process.exit(result.status !== null ? result.status : 1);
