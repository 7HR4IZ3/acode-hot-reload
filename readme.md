# acode-hot-reload

A modern hot-reload development server for [Acode Editor](https://acode.foxdebug.com/), designed to streamline plugin development with instant updates, live reloading, and flexible configuration.

---

## Features

- **Instant Hot Reload**: Automatically rebuilds and pushes updates to connected Acode clients when files change.
- **Flexible Configuration**: Supports custom entry points, extra files, debounce timing, and more via `hot.reload.json` or CLI options.
- **Interactive CLI UI**: Beautiful terminal interface with live status, logs, config display, and interactive controls.
- **Multi-client Support**: Broadcasts updates to all connected Acode clients.
- **Robust File Watching**: Ignores `node_modules`, `dist`, `.git`, and dotfiles for reliable performance.
- **TypeScript & JavaScript Support**: Works with both TS and JS plugin projects.

---

## Installation

### Prerequisites

- [Bun](https://bun.sh/) (recommended for speed and compatibility)
- Node.js (optional, but Bun is preferred)
- Acode Editor (for plugin testing)

### Install Dependencies

```sh
bun install
```

---

## Usage

### Start the Hot Reload Server

```sh
bun --hot ./server/index.tsx [plugin-directory] [options]
```

- If `[plugin-directory]` is omitted, the current directory is used.

### Example

```sh
bun --hot ./server/index.tsx ./my-plugin --port 3000 --main-entry src/index.ts --extra-files assets/icon.png assets/config.json --debounce 500
```

---

## How to Use in Acode Editor

After starting the hot reload server, connect your plugin in Acode:

1. **Open the Command Palette**  
   Press <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd> (Windows/Linux) or <kbd>Command</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd> (Mac).

2. **Run the Command**  
   Type and select **Connect to Hot Reload Server**.

3. **Or Use the Shortcut**  
   Press <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>H</kbd> (Windows/Linux) or <kbd>Command</kbd> + <kbd>Alt</kbd> + <kbd>H</kbd> (Mac).

4. **Enter the WebSocket URL**  
   When prompted, enter the server URL (e.g. `ws://localhost:3000`).  
   You can also set a default URL in the plugin settings.

Once connected, your plugin will receive live updates whenever you save changes in your development directory.

---

## Configuration

You can configure acode-hot-reload via a `hot.reload.json` file in your plugin directory **or** by passing CLI options.

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

## Contributing

Contributions, bug reports, and feature requests are welcome!

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/my-feature`).
3. Commit your changes.
4. Open a pull request.

Please follow the existing code style and add tests where appropriate.

---

## License

MIT License. See [LICENSE](./LICENSE) for details.

---

## Resources

- [Acode Plugin Documentation](https://acode.foxdebug.com/plugin-docs)
- [Bun Documentation](https://bun.sh/docs)
- [Ink Documentation](https://github.com/vadimdemedes/ink)