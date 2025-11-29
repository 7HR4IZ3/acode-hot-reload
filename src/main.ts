import plugin from "../plugin.json";
import { SocketClient } from "./socket";

const select = acode.require("select");
const prompt = acode.require("prompt");

class HotReloadPlugin {
  private socket: SocketClient;
  private baseUrl: string | undefined;

  constructor() {
    this.socket = new SocketClient();
  }

  get settings() {
    if (!window.acode) {
      return this.defaultSettings;
    }
    const AppSettings = acode.require("settings") as any;
    let value = AppSettings.value[plugin.id];
    if (!value) {
      value = AppSettings.value[plugin.id] = this.defaultSettings;
      AppSettings.update();
    }
    return value;
  }

  get defaultSettings() {
    return {
      websocketUrl: "ws://localhost:3000"
    };
  }

  get settingsObject() {
    const AppSettings = acode.require("settings");
    return {
      list: [
        {
          key: "websocketUrl",
          text: "Hot Reload WebSocket URL",
          prompt: "WebSocket URL for Hot Reload Server",
          promptType: "text",
          value: this.settings.websocketUrl
        }
      ],
      cb: (key: string, value: any) => {
        (AppSettings.value as any)[plugin.id][key] = value;
        AppSettings.update();
      }
    };
  }

  async init($page: HTMLElement, cacheFile: any, cacheFileUrl: string) {
    // Add command to connect
    editorManager.editor.commands.addCommand({
      name: "acode-hot-reload:connect",
      description: "Connect to Hot Reload Server",
      bindKey: { win: "Ctrl-Alt-H", mac: "Command-Alt-H" },
      exec: async () => {
        const url = await prompt("Enter Server URL", this.settings.websocketUrl);
        if (url) {
          this.socket.connect(url as string);
        }
      },
    });

    // Auto-connect on load if configured
    if (this.settings.websocketUrl) {
      this.socket.connect(this.settings.websocketUrl);
    }
  }

  async destroy() {
    this.socket.disconnect();
    editorManager.editor.commands.removeCommand("acode-hot-reload:connect");
  }
}

if (window.acode) {
  const acodePlugin = new HotReloadPlugin();
  acode.setPluginInit(
    plugin.id,
    (baseUrl, $page, { cacheFileUrl, cacheFile }) => {
      if (!baseUrl.endsWith("/")) {
        baseUrl += "/";
      }
      (acodePlugin as any).baseUrl = baseUrl;
      acodePlugin.init($page, cacheFile, cacheFileUrl);
    },
    acodePlugin.settingsObject
  );
  acode.setPluginUnmount(plugin.id, () => {
    acodePlugin.destroy();
  });
}
