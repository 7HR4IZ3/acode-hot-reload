import { installPluginZip } from "./installer";

const createWebsocket = async (url: string): Promise<WebSocket> => {
  // @ts-expect-error
  if (cordova?.websocket) {
  // @ts-expect-error
    return cordova.websocket.connect(url);
  }
  return new WebSocket(url)
}

export class SocketClient {
    private ws: WebSocket | null = null;
    private url: string;

    constructor(url: string = "ws://10.165.210.38:3000") {
        this.url = url;
    }

    async connect(url?: string) {
        if (url) this.url = url;

        if (this.ws) {
            this.ws.close();
        }

        console.log(`Connecting to ${this.url}...`);
        try {
            this.ws = await createWebsocket(this.url);
        } catch (e) {
            console.error("Invalid WebSocket URL", e);
            window.toast("Invalid Hot Reload Server URL", 3000);
            return;
        }

        this.ws.onopen = () => {
            console.log("Connected to Hot Reload Server");
            window.toast("Connected to Hot Reload Server", 3000);
        };

        this.ws.onclose = () => {
            console.log("Disconnected from Hot Reload Server");
            // window.toast("Disconnected from Hot Reload Server", 3000);
            // Auto reconnect? Maybe not, to avoid spam.
        };

        this.ws.onerror = (err) => {
            console.error("Hot Reload Socket Error", err);
            window.toast("Hot Reload Connection Error", 3000);
        };

        this.ws.onmessage = async (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === "update") {
                    window.toast("Receiving update...", 2000);
                    await installPluginZip(data.payload.zip);
                    window.toast("Hot Reload Complete", 2000);
                    this.ws?.send(JSON.stringify({ type: "done" }));
                }
            } catch (err) {
                console.error("Error processing update", err);
                window.toast("Hot Reload Failed", 3000);
            }
        };
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}
