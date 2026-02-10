# Contributing to Magnet CLI

## Development

```bash
bun install
bun run build
bun test
```

## Testing

### 1. Unit tests (no API key)

```bash
bun test
```

Runs tests for config (env, UUID validation) and API client.

**One-shot smoke test** (unit tests + build + `magnet --help` + assert missing/invalid API key exits 1):

```bash
bun run test-smoke
```

### 2. CLI locally against the real API

Set your API key, then run commands:

```bash
export MAGNET_API_KEY="your-uuid-from-magnet-settings"
bun run build

./magnet issues list
./magnet issues list --limit 5
./magnet pages list
./magnet search "my query" --types issue,page

# Create (optional – creates real data)
./magnet issues create --description "CLI test" --title "Test issue"
./magnet pages create --title "Test page" --markdown "# Hello"
```

### 3. Expect failure without API key

```bash
unset MAGNET_API_KEY
./magnet issues list
# → stderr: "Missing Magnet API key. Set MAGNET_API_KEY." and exit 1
```

### 4. CI (GitHub Actions)

- **Push to `main`** or **open a PR** → runs `bun test` and `bun run build` (see [Actions](https://github.com/toolkit-ai/magnet-cli/actions)).
- To test CI from a fork, push a branch and open a PR against `main`.

### 5. Release workflow (build + GitHub Release)

- **Push a version tag** to trigger the release workflow:

  ```bash
  git tag v0.1.0
  git push origin v0.1.0
  ```

  This builds native binaries (Bun compile) for linux-amd64, darwin-arm64, and windows-amd64 and creates a GitHub Release with the artifacts.

- To **test the release workflow without publishing** a real release: push a tag like `v0.0.0-test`, run the workflow, then delete the tag and the draft release from the repo.

### 6. Test the download script (optional)

From the repo root:

```bash
npm run download
./bin/magnet.cjs --help
```

This requires an existing GitHub Release (e.g. after you've pushed a `v*` tag once) to download the binary.
