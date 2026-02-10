# @magnet-ai/cli

Install the **Magnet CLI** via npm. This package downloads the native binary for your platform from [GitHub Releases](https://github.com/toolkit-ai/magnet-cli/releases) at install time. You do not need Node.js to run the CLI after installation.

## Install

```bash
npm install -g @magnet-ai/cli
```

Then run:

```bash
magnet --help
magnet issues list
magnet search "query"
```

## Requirements

Set your Magnet API key before using the CLI:

```bash
export MAGNET_API_KEY="your-uuid-api-key"
```

Get an API key from your [Magnet](https://www.magnet.run) organization settings.

## Test the download (before releasing)

From the `npm` folder, run the download script to fetch the binary from the latest GitHub Release:

```bash
cd npm
npm run download
# or: node bin/download.js
```

To test against a specific release tag: `MAGNET_CLI_VERSION=v0.1.0 node bin/download.js`. Then run `./bin/magnet.js --help` to confirm the binary works.

## Full documentation

See the [main repository](https://github.com/toolkit-ai/magnet-cli) for commands, pagination, and other install options (direct download, build from source).

## License

MIT
