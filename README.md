# Magnet CLI

A self-sufficient CLI for [Magnet](https://www.magnet.run): list, get, and create issues and pages, and search. Single native binary — **no Node.js or other runtime required**.

## Requirements

- **API key**: Create an API key in your Magnet organization settings, then set it:

  ```bash
  export MAGNET_API_KEY="your-uuid-api-key"
  ```

- **Base URL** (optional): Default is `https://www.magnet.run`. Override with:

  ```bash
  export MAGNET_API_URL="https://www.magnet.run"
  ```

## Installation

Choose one of the following. No Node.js is required unless you use the npm installer.

### 1. GitHub Releases (recommended)

Download the binary for your platform from [Releases](https://github.com/magnet-run/magnet-cli/releases). Extract and put `magnet` (or `magnet.exe` on Windows) in your `PATH`.

**Example (Linux/macOS):**

```bash
# Set version and platform (e.g. linux-amd64, darwin-arm64, darwin-amd64, windows-amd64)
VERSION="v0.1.0"
PLATFORM="darwin-arm64"
curl -sSL "https://github.com/magnet-run/magnet-cli/releases/download/${VERSION}/magnet-cli-${PLATFORM}.tar.gz" | tar xz
sudo mv magnet /usr/local/bin/
```

**Windows (PowerShell):**

```powershell
$VERSION = "v0.1.0"
Invoke-WebRequest -Uri "https://github.com/magnet-run/magnet-cli/releases/download/$VERSION/magnet-cli-windows-amd64.tar.gz" -OutFile magnet-cli.tar.gz
tar -xzf magnet-cli.tar.gz
# Move magnet.exe to a folder in PATH
```

### 2. npm (wrapper that downloads the binary)

If you have Node.js and npm, you can install the wrapper package. It downloads the correct binary from GitHub Releases at install time; you do **not** need Node to run the CLI afterward.

```bash
npm install -g @magnet/cli
```

Then run `magnet` as usual.

### 3. Homebrew (macOS/Linux)

If we publish a Homebrew tap:

```bash
brew install magnet-run/tap/magnet-cli
```

_(Add this section once the tap is set up.)_

### 4. Build from source

Requires [Go 1.22+](https://go.dev/dl/).

```bash
git clone https://github.com/magnet-run/magnet-cli.git
cd magnet-cli
go build -o magnet .
./magnet --help
```

## Commands

### Issues

- **List**: `magnet issues list [--search q] [--limit n] [--cursor c]`  
  GET /api/issues. Pagination: use `--limit` for page size and `--cursor` with the `pagination.nextCursor` value from the previous response.

- **Get**: `magnet issues get <id>`  
  GET /api/issues/:id

- **Create**: `magnet issues create --description "..." [--title "..."] [--base-branch main]`  
  POST /api/issues/markdown (description is used as markdown and description; base-branch defaults to `main`)

### Pages

- **List**: `magnet pages list [--search q] [--limit n] [--cursor c]`  
  GET /api/pages. Pagination: use `--limit` and `--cursor` (from `pagination.nextCursor`) for the next page.

- **Get**: `magnet pages get <id>`  
  GET /api/pages/:id

- **Create**: `magnet pages create --title "..." [--markdown "..."]`  
  POST /api/pages/markdown (if `--markdown` is omitted, title is used as content)

### Search

- **Search**: `magnet search <query> [--types issue,page]`  
  GET /api/search (types default to both if omitted)

## Output

All commands print JSON to stdout. Errors go to stderr and the process exits with a non-zero code.

**Pagination (issues list / pages list):** The response includes `pagination: { total, hasMore, nextCursor }`. To fetch the next page, set `--cursor` to `pagination.nextCursor`. Use the same `--limit` as the first request (or omit it: when you pass `--cursor` without `--limit`, the CLI uses a default page size of 50 so the cursor works). Example:

```bash
magnet issues list --limit 20                    # first page
magnet issues list --limit 20 --cursor "abc123"  # next page (use nextCursor from above)
# or omit limit when using cursor (default 50 is sent):
magnet issues list --cursor "abc123"
```

## Development

```bash
go build -o magnet .
go test ./...
```

## Testing

### 1. Unit tests (no API key)

```bash
go test -v ./...
# or
make test
```

Runs tests for config (env, UUID validation), API client (mock server), and command help.

**One-shot smoke test** (unit tests + build + `magnet --help` + assert missing/invalid API key exits 1):

```bash
make test-smoke
```

### 2. CLI locally against the real API

Set your API key, then run commands:

```bash
export MAGNET_API_KEY="your-uuid-from-magnet-settings"
go build -o magnet .

# List issues (JSON to stdout)
./magnet issues list
./magnet issues list --limit 5

# List pages
./magnet pages list

# Search
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

- **Push to `main`** or **open a PR** → runs `go test` and `go build` (see [Actions](https://github.com/magnet-run/magnet-cli/actions)).
- To test CI from a fork, push a branch and open a PR against `main`.

### 5. Release workflow (build + GitHub Release)

- **Push a version tag** to trigger the release workflow:

  ```bash
  git tag v0.1.0
  git push origin v0.1.0
  ```

  This builds binaries for linux-amd64, linux-arm64, darwin-amd64, darwin-arm64, windows-amd64 and creates a GitHub Release with the artifacts.

- To **test the release workflow without publishing** a real release: push a tag like `v0.0.0-test`, run the workflow, then delete the tag and the draft release from the repo.

### 6. NPM wrapper (optional)

From the repo root:

```bash
cd npm
npm install
node bin/download.js   # downloads binary for current OS/arch (requires a published release)
./bin/magnet.js --help # runs the downloaded binary
```

The postinstall script needs an existing GitHub Release (e.g. after you’ve pushed a `v*` tag once) to download the binary.

## License

MIT — see [LICENSE](LICENSE).
