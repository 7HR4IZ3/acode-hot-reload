import chokidar from "chokidar";
import path from "path";
import { EventEmitter } from "events";

function debounce<T extends (...args: any[]) => void>(func: T, delay: number): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null;
    return (...args: Parameters<T>) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
            func(...args);
            timeout = null;
        }, delay);
    };
}

export class Watcher extends EventEmitter {
  // @ts-expect-error
    private watcher: chokidar.FSWatcher | null = null;
    private debounceMs: number;

    constructor(private targetDir: string, debounceMs?: number) {
        super();
        this.debounceMs = debounceMs ?? 1000;
    }

    start() {
        if (this.watcher) this.watcher.close();

        console.log(`Starting watcher on ${this.targetDir}`);
        this.watcher = chokidar.watch(this.targetDir, {
            ignored: [
                /(^|[\/\\])\../, // ignore dotfiles
                path.join(this.targetDir, "node_modules"),
                path.join(this.targetDir, "dist"),
                path.join(this.targetDir, ".git"),
                "**/node_modules/**",
                "**/dist/**",
                "**/.git/**"
            ],
            persistent: true,
            ignoreInitial: true,
        });

        const debouncedEmitChange = debounce((event: string, type: string, filePath: string) => {
            this.emit(event, type, filePath);
        }, this.debounceMs);

        this.watcher
            .on("add", (filePath: string) => debouncedEmitChange("change", "add", filePath))
            .on("change", (filePath: string) => debouncedEmitChange("change", "change", filePath))
            .on("unlink", (filePath: string) => debouncedEmitChange("change", "unlink", filePath));

        this.emit("ready");
    }

    stop() {
        if (this.watcher) {
            this.watcher.close();
            this.watcher = null;
        }
    }
}
