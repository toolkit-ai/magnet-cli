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

Download the binary for your platform from [Releases](https://github.com/toolkit-ai/magnet-cli/releases). Extract and put `magnet` (or `magnet.exe` on Windows) in your `PATH`.

**Example (Linux/macOS):**

```bash
VERSION="v0.1.0"
PLATFORM="darwin-arm64"   # or linux-amd64, windows-amd64
curl -sSL "https://github.com/toolkit-ai/magnet-cli/releases/download/${VERSION}/magnet-cli-${PLATFORM}.tar.gz" | tar xz
sudo mv magnet /usr/local/bin/
```

**Windows (PowerShell):**

```powershell
$VERSION = "v0.1.0"
Invoke-WebRequest -Uri "https://github.com/toolkit-ai/magnet-cli/releases/download/$VERSION/magnet-cli-windows-amd64.tar.gz" -OutFile magnet-cli.tar.gz
tar -xzf magnet-cli.tar.gz
# Move magnet.exe to a folder in PATH
```

### 2. npm (wrapper that downloads the binary)

If you have Node.js and npm:

```bash
npm install -g @magnet-ai/cli
```

Install finishes quickly; the first time you run `magnet`, it downloads the binary. You do **not** need Node to run the CLI afterward.

### 3. Homebrew (macOS/Linux)

_(Coming soon. Add when the tap is set up.)_

### 4. Build from source

Requires [Bun](https://bun.sh).

```bash
git clone https://github.com/toolkit-ai/magnet-cli.git
cd magnet-cli
bun install
bun run build
./magnet --help
```

For development, testing, and release workflow, see [CONTRIBUTING.md](CONTRIBUTING.md).

## Commands

### Issues

- **List**: `magnet issues list [--search q] [--limit n] [--cursor c]`  
  Pagination: use `--limit` and `--cursor` (from `pagination.nextCursor`) for the next page.

- **Get**: `magnet issues get <id> [--preview-only]`  
  Uses the markdown API; returns issue with `docContent` (full markdown). Use `--preview-only` for truncated `markdownPreview`.

- **Create**: `magnet issues create --description "..." [--title "..."] [--base-branch main]`

- **Update**: `magnet issues update <id> --markdown "..." [--title "..."] [--status todo|in_progress|done|blocked] [--assignee-clerk-id id] [--skip-yjs-sync]`

### Pages

- **List**: `magnet pages list [--search q] [--limit n] [--cursor c]`

- **Get**: `magnet pages get <id> [--preview-only]`  
  Uses the markdown API; returns page with `docContent` (full markdown). Use `--preview-only` for truncated `markdownPreview`.

- **Create**: `magnet pages create --title "..." [--markdown "..."]`

- **Update**: `magnet pages update <id> --markdown "..." [--title "..."] [--skip-yjs-sync]`

### Search

- **Search**: `magnet search <query> [--types issue,page]`

## Output

All commands print JSON to stdout. Errors go to stderr and the process exits with a non-zero code.

**Pagination (issues list / pages list):** The response includes `pagination: { total, hasMore, nextCursor }`. To fetch the next page, set `--cursor` to `pagination.nextCursor`. You can omit `--limit` when using `--cursor` (default page size 50 is sent).

```bash
magnet issues list --limit 20                    # first page
magnet issues list --limit 20 --cursor "abc123"  # next page
magnet issues list --cursor "abc123"              # next page (default limit 50)
```

## License

MIT — see [LICENSE](LICENSE).
