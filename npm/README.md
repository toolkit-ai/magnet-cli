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

## Full documentation

See the [main repository](https://github.com/toolkit-ai/magnet-cli) for commands, pagination, and other install options (direct download, build from source).

## License

MIT
