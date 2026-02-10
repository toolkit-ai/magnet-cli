#!/usr/bin/env sh
set -e
echo "--- Smoke: magnet --help ---"
./magnet --help
echo "--- Smoke: missing API key exits 1 ---"
MAGNET_API_KEY= ./magnet issues list 2>/dev/null && exit 1 || true
echo "--- Smoke: invalid API key exits 1 ---"
MAGNET_API_KEY=not-a-uuid ./magnet issues list 2>/dev/null && exit 1 || true
echo "smoke OK"
