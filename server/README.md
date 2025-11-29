# acode-hot-reload Server

A robust hot-reload development server for [Acode Editor](https://acode.foxdebug.com/), designed to accelerate plugin development with instant updates, live reloading, and a beautiful interactive CLI.

---

## Overview

This server watches your plugin source directory for changes, automatically rebuilds your plugin, and broadcasts updates to all connected Acode clients via WebSocket. It features a modern CLI interface, flexible configuration, and multi-client support.

---

## Features

- **Hot Reload**: Instantly rebuilds and sends updates to Acode clients when files change.
- **Flexible Configuration**: Supports custom entry points, extra files, debounce timing, and more via `hot.reload.json` or CLI options.
- **Interactive CLI UI**: Live status, logs, config display, and interactive controls.
- **Multi-client Broadcasting**: Updates are sent to all connected clients.
- **Robust File Watching**: Ignores `node_modules`, `dist`, `.git`, and dotfiles for reliability.
- **TypeScript & JavaScript Support**: Works with both TS and JS plugin projects.
- **Bun Native**: Built for [Bun](https://bun.sh/) for speed and simplicity.

---

## Installation

### Prerequisites

- [Bun](https://bun.sh/) (recommended)
- Node.js (optional, but Bun is preferred)

### Install Dependencies

```sh
bun install
```

---

## Configuration

You can configure the server via a `hot.reload.json` file in your plugin directory or by passing CLI options.

### `hot.reload.json` Example

```json
{
  "mainEntry": "src/index.ts",
  "extraFiles": [
    "assets/icon.png",
    "assets/config.json"
  ],
  "debounce": 500
}
```

### CLI Options

| Option                | Description                                         | Default         |
|-----------------------|-----------------------------------------------------|-----------------|
| `--port, -p`          | Port for the server                                 | `3000`          |
| `--config, -c`        | Path to config file (`hot.reload.json`)             | auto-detect     |
| `--main-entry`        | Main entry file for plugin                          | `main.ts/js/tsx`|
| `--extra-files`       | Extra files to include in the zip                   | none            |
| `--debounce`          | Debounce time for watcher (ms)                      | `1000`          |

**CLI options override values in `hot.reload.json`.**

---

## Usage

### Start the Server

```sh
bun --hot ./index.tsx [plugin-directory] [options]
```

- If `[plugin-directory]` is omitted, the current directory is used.

### Example

```sh
bun --hot ./index.tsx ./my-plugin --port 3000 --main-entry src/index.ts --extra-files assets/icon.png assets/config.json --debounce 500
```

---

## Environment

- **Runs on Bun**: Fast, modern JavaScript runtime.
- **No Node.js required** (but compatible).
- **Works on macOS, Linux, and Windows (with Bun support).**

---

## Interactive CLI Controls

- `[r]` — Manual rebuild
- `[p]` — Pause/Resume watcher
- `[q]` — Quit server
- `[1-5]` — Filter logs (All, Info, Success, Warning, Error)

---

## Troubleshooting

### Common Issues

- **Watcher errors on node_modules**: Ensure your plugin directory does not include `node_modules` or use robust ignore patterns (already handled by default).
- **Bun compatibility**: Use React 18 and Ink 6. Advanced Ink plugins may not work; stick to core components.
- **Port conflicts**: Change the port with `--port` if another service is using it.

### Debugging

- Check logs in the CLI UI for build errors, watcher status, and client connections.
- If you encounter Bun-specific errors, try updating Bun or running with Node.js for comparison.

---

## Development

### Project Structure

- `index.tsx` — Main server entry point and CLI UI.
- `builder.ts` — Handles plugin building and zipping.
- `watcher.ts` — Watches files for changes.
- `socket.ts` — WebSocket server for client communication.
- `config.ts` — Loads and merges configuration.

### Recommended Workflow

1. Start the server with your plugin directory.
2. Connect your Acode client (see main README for details).
3. Edit your plugin files and watch for instant updates!

---

## License

MIT License. See [LICENSE](../LICENSE) for details.

---

## Resources

- [Acode Plugin Documentation](https://acode.foxdebug.com/plugin-docs)
- [Bun Documentation](https://bun.sh/docs)
- [Ink Documentation](https://github.com/vadimdemedes/ink)