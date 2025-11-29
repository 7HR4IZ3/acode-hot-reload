import { WebSocketServer, WebSocket } from "ws";
import { EventEmitter } from "events";
import { createServer } from "http";
import express from "express";
import fs from "fs";

export class SocketServer extends EventEmitter {
    private wss: WebSocketServer;
    private clients: Set<WebSocket> = new Set();
    private app = express();
    private server = createServer(this.app);

    constructor(private port: number = 3000) {
        super();
        this.wss = new WebSocketServer({ server: this.server });

        this.wss.on("connection", (ws) => {
            this.clients.add(ws);
            this.emit("connection", this.clients.size);

            ws.on("close", () => {
                this.clients.delete(ws);
                this.emit("disconnection", this.clients.size);
            });

            ws.on("message", (message) => {
                try {
                    const data = JSON.parse(message.toString());
                    this.emit("message", data, ws);
                } catch (e) {
                    console.error("Failed to parse message", e);
                }
            });
        });

        // Serve static files if needed, or just basic health check
        this.app.get("/", (req, res) => {
            res.send("Acode Hot Reload Server Running");
        });
    }

    start() {
        this.server.listen(this.port, () => {
            console.log(`Server started on port ${this.port}`);
            this.emit("listening", this.port);
        });
    }

    broadcast(type: string, payload: any) {
        const message = JSON.stringify({ type, payload });
        for (const client of this.clients) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        }
    }

    broadcastFile(filePath: string) {
        if (!fs.existsSync(filePath)) return;

        const fileBuffer = fs.readFileSync(filePath);
        // Send binary data directly or base64 encoded?
        // Acode plugin side might expect blob.
        // Let's send a control message first, then the binary, or just base64 in JSON.
        // Base64 in JSON is safer for simple protocol.

        const base64 = fileBuffer.toString('base64');
        this.broadcast('update', { zip: base64 });
    }
}
