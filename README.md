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

*(Add this section once the tap is set up.)*

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
  GET /api/issues

- **Get**: `magnet issues get <id>`  
  GET /api/issues/:id

- **Create**: `magnet issues create --description "..." [--title "..."] [--base-branch main]`  
  POST /api/issues/markdown (description is used as markdown and description; base-branch defaults to `main`)

### Pages

- **List**: `magnet pages list [--search q] [--limit n] [--cursor c]`  
  GET /api/pages

- **Get**: `magnet pages get <id>`  
  GET /api/pages/:id

- **Create**: `magnet pages create --title "..." [--markdown "..."]`  
  POST /api/pages/markdown (if `--markdown` is omitted, title is used as content)

### Search

- **Search**: `magnet search <query> [--types issue,page]`  
  GET /api/search (types default to both if omitted)

## Output

All commands print JSON to stdout. Errors go to stderr and the process exits with a non-zero code.

## Development

```bash
go build -o magnet .
go test ./...
```

## License

MIT — see [LICENSE](LICENSE).
