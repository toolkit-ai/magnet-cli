#!/usr/bin/env node
/**
 * Postinstall: download the magnet binary from GitHub Releases for this OS/arch.
 * Requires no Node at runtime; the bin/magnet.js wrapper runs the downloaded binary.
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

// Use repo from package.json so it works when published from any org (e.g. toolkit-ai/magnet-cli)
function getRepo() {
  try {
    const pkg = require(path.join(__dirname, '..', 'package.json'));
    const url = (pkg.repository && pkg.repository.url) || pkg.repository || '';
    const m = url.match(/github\.com[:/]([^/]+\/[^/]+?)(?:\.git)?$/);
    return m ? m[1] : 'toolkit-ai/magnet-cli';
  } catch (_) {
    return 'toolkit-ai/magnet-cli';
  }
}
const REPO = process.env.MAGNET_CLI_REPO || getRepo();
const VERSION = process.env.MAGNET_CLI_VERSION || 'latest';
const BIN_DIR = path.join(__dirname, '..', 'bin');
const BINARY = process.platform === 'win32' ? 'magnet.exe' : 'magnet';

function getPlatform() {
  const os = process.platform;
  const arch = process.arch;
  if (os === 'darwin' && arch === 'x64') return 'darwin-amd64';
  if (os === 'darwin' && arch === 'arm64') return 'darwin-arm64';
  if (os === 'linux' && arch === 'x64') return 'linux-amd64';
  if (os === 'linux' && arch === 'arm64') return 'linux-arm64';
  if (os === 'win32' && arch === 'x64') return 'windows-amd64';
  return null;
}

function fetch(url, redirects = 0) {
  if (redirects > 5) return Promise.reject(new Error('Too many redirects'));
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'magnet-cli-npm' } }, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        const loc = res.headers.location;
        if (loc) return fetch(loc, redirects + 1).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
    req.on('error', reject);
  });
}

async function getLatestTag() {
  const data = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`);
  const text = data.toString();
  if (text.length < 10) throw new Error('Empty response from GitHub');
  const j = JSON.parse(text);
  if (!j.tag_name) throw new Error('No releases found. Push a tag (e.g. v0.1.0) to trigger a release.');
  return j.tag_name;
}

async function main() {
  const platform = getPlatform();
  if (!platform) {
    console.warn('@magnet-ai/cli: No prebuilt binary for ' + process.platform + '/' + process.arch + '. Install from GitHub Releases.');
    return;
  }
  const tag = VERSION === 'latest' ? await getLatestTag() : VERSION;
  const archiveName = `magnet-cli-${platform}.tar.gz`;
  const url = `https://github.com/${REPO}/releases/download/${tag}/${archiveName}`;
  fs.mkdirSync(BIN_DIR, { recursive: true });
  const destPath = path.join(BIN_DIR, BINARY);
  try {
    const buf = await fetch(url);
    if (buf.length < 1000) {
      const text = buf.toString();
      if (text.includes('Not Found')) throw new Error('Release not found: ' + tag);
      throw new Error('Download failed: ' + text.slice(0, 200));
    }
    const tmpTar = path.join(BIN_DIR, archiveName);
    fs.writeFileSync(tmpTar, buf);
    try {
      execSync(`tar -xzf "${tmpTar}" -C "${BIN_DIR}"`, { stdio: 'inherit' });
    } finally {
      try { fs.unlinkSync(tmpTar); } catch (_) {}
    }
    const extracted = path.join(BIN_DIR, process.platform === 'win32' ? 'magnet.exe' : 'magnet');
    if (extracted !== destPath && fs.existsSync(extracted)) {
      try { fs.unlinkSync(destPath); } catch (_) {}
      fs.renameSync(extracted, destPath);
    }
    fs.chmodSync(destPath, 0o755);
  } catch (e) {
    console.warn('@magnet-ai/cli: Could not download binary:', e.message);
  }
}

main().catch((e) => {
  console.warn('@magnet-ai/cli postinstall:', e.message);
});
