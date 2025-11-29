import React, { useState, useEffect, useRef } from "react";
import { Box, Text, useApp, useInput } from "ink";

interface Log {
    id: number;
    message: string;
    type: "info" | "success" | "error" | "warning";
    timestamp: string;
}

interface HotReloadConfig {
    mainEntry?: string;
    extraFiles?: string[];
    debounce?: number;
    [key: string]: any;
}

interface AppProps {
    watcher: any;
    socket: any;
    builder: any;
    targetDir: string;
    config: HotReloadConfig;
}

const STATUS_ICONS = {
    idle: "🟢",
    building: "🟡",
    error: "🔴"
};

const LOG_ICONS = {
    info: "ℹ️",
    success: "✅",
    error: "❌",
    warning: "⚠️"
};

const LOG_FILTERS = ["all", "info", "success", "warning", "error"];

const App: React.FC<AppProps> = ({ watcher, socket, builder, targetDir, config }) => {
    const { exit } = useApp();
    const [clients, setClients] = useState(0);
    const [logs, setLogs] = useState<Log[]>([]);
    const [status, setStatus] = useState<"idle" | "building" | "error">("idle");
    const [lastBuild, setLastBuild] = useState<string | null>(null);
    const [paused, setPaused] = useState(false);
    const [logFilter, setLogFilter] = useState("all");
    const [highlightConfig, setHighlightConfig] = useState<string | null>(null);

    // For config change animation
    const prevConfig = useRef(config);

    // Handle keypresses
    useInput((input, key) => {
        if (input === "q") exit();
        if (input === "r") handleManualRebuild();
        if (input === "p") handlePauseResume();
        if (["1", "2", "3", "4", "5"].includes(input)) {
            setLogFilter(LOG_FILTERS[parseInt(input) - 1] || "all");
        }
    });

    // Animate config changes
    useEffect(() => {
        Object.entries(config).forEach(([key, value]) => {
            if (prevConfig.current[key] !== value) {
                setHighlightConfig(key);
                setTimeout(() => setHighlightConfig(null), 1000);
            }
        });
        prevConfig.current = config;
    }, [config]);

    const addLog = (message: string, type: "info" | "success" | "error" | "warning" = "info") => {
        setLogs((prev) => [
            ...prev.slice(-9),
            {
                id: Date.now(),
                message,
                type,
                timestamp: new Date().toLocaleTimeString(),
            },
        ]);
    };

    useEffect(() => {
        socket.on("connection", (count: number) => {
            setClients(count);
            addLog(`Client connected. Total: ${count}`, "info");
        });

        socket.on("disconnection", (count: number) => {
            setClients(count);
            addLog(`Client disconnected. Total: ${count}`, "warning");
        });

        socket.on("message", (data: any) => {
            if (data.type === 'done') {
                addLog(`Client installed update successfully`, "success");
            }
        });

        watcher.on("change", async (event: string, path: string) => {
            addLog(`File changed: ${path}`, "info");
            setStatus("building");
            try {
                const zipPath = await builder.buildPlugin(targetDir, "./dist", config);
                addLog(`Build successful: ${zipPath}`, "success");
                setLastBuild(new Date().toLocaleTimeString());
                socket.broadcastFile(zipPath);
                addLog(`Update sent to ${clients} clients`, "info");
                setStatus("idle");
            } catch (err: any) {
                addLog(`Build failed: ${err.message}`, "error");
                setStatus("error");
            }
        });

        watcher.on("ready", () => {
            addLog(`Watching ${targetDir}`, "info");
        });

        watcher.start();
        socket.start();

        return () => {
            watcher.stop();
        };
    }, []);

    // Manual rebuild
    const handleManualRebuild = async () => {
        addLog("Manual rebuild triggered.", "info");
        setStatus("building");
        try {
            const zipPath = await builder.buildPlugin(targetDir, "./dist", config);
            addLog(`Manual build successful: ${zipPath}`, "success");
            setLastBuild(new Date().toLocaleTimeString());
            socket.broadcastFile(zipPath);
            addLog(`Update sent to ${clients} clients`, "info");
            setStatus("idle");
        } catch (err: any) {
            addLog(`Manual build failed: ${err.message}`, "error");
            setStatus("error");
        }
    };

    // Pause/resume watcher
    const handlePauseResume = () => {
        if (paused) {
            watcher.start();
            addLog("Watcher resumed.", "info");
        } else {
            watcher.stop();
            addLog("Watcher paused.", "warning");
        }
        setPaused(!paused);
    };

    // Filter logs
    const filteredLogs = logFilter === "all"
        ? logs
        : logs.filter(log => log.type === logFilter);

    // Helper for config display
    const configRows = [
        { label: "Main Entry", value: config.mainEntry || "main.ts/js/tsx", key: "mainEntry" },
        { label: "Extra Files", value: Array.isArray(config.extraFiles) && config.extraFiles.length > 0 ? config.extraFiles.join(", ") : "none", key: "extraFiles" },
        { label: "Debounce", value: `${config.debounce ?? 1000}ms`, key: "debounce" },
        ...Object.entries(config)
            .filter(([key]) => !["mainEntry", "extraFiles", "debounce"].includes(key))
            .map(([key, value]) => ({ label: key, value: JSON.stringify(value), key }))
    ];

    return (
        <Box
            flexDirection="column"
            padding={1}
            borderStyle="double"
            borderColor="cyan"
            width={process.stdout.columns}
        >
            {/* Header */}
            <Box justifyContent="center" marginBottom={1}>
                <Text bold color="cyan">
                    <Text>🚀 </Text>
                    <Text color="magenta">Acode Hot Reload Server</Text>
                    <Text> 🚀</Text>
                </Text>
            </Box>

            {/* Status & Controls */}
            <Box flexDirection="row" marginBottom={1} justifyContent="space-between">
                <Box>
                    <Text>
                        <Text bold>Status:</Text>{" "}
                        <Text color={status === "building" ? "yellow" : status === "error" ? "red" : "green"}>
                            {STATUS_ICONS[status]} {status.toUpperCase()}
                        </Text>
                        {paused && <Text color="red"> (Paused)</Text>}
                    </Text>
                </Box>
                <Box>
                    <Text>
                        <Text bold>Clients:</Text>{" "}
                        <Text color="blue">
                            {Array.from({ length: clients }).map((_, i) => "🧑‍💻").join("") || "—"}
                        </Text>
                    </Text>
                </Box>
                <Box>
                    {lastBuild && (
                        <Text>
                            <Text bold>Last Build:</Text>{" "}
                            <Text color="green">{lastBuild}</Text>
                        </Text>
                    )}
                </Box>
            </Box>

            {/* Interactive Controls */}
            <Box flexDirection="row" marginBottom={1}>
                <Text bold color="cyan">[r]</Text>
                <Text> </Text>
                <Text>Rebuild</Text>
                <Text>  </Text>
                <Text bold color="cyan">[p]</Text>
                <Text> </Text>
                <Text>Pause/Resume</Text>
                <Text>  </Text>
                <Text bold color="cyan">[q]</Text>
                <Text> </Text>
                <Text>Quit</Text>
                <Text>  </Text>
                <Text bold color="yellow">[1-5]</Text>
                <Text> </Text>
                <Text>Log Filter</Text>
            </Box>
            <Box marginBottom={1}>
                <Text bold color="yellow">Log Filters:</Text>
                <Text> </Text>
                <Text>[1] All</Text>
                <Text> </Text>
                <Text>[2] Info</Text>
                <Text> </Text>
                <Text>[3] Success</Text>
                <Text> </Text>
                <Text>[4] Warning</Text>
                <Text> </Text>
                <Text>[5] Error</Text>
                <Text>  </Text>
                <Text color="magenta">Current: {logFilter.toUpperCase()}</Text>
            </Box>

            {/* Config Section with highlight animation */}
            <Box flexDirection="column" marginBottom={1} borderStyle="classic" borderColor="magenta" padding={1}>
                <Text underline color="magenta">⚙️ Config</Text>
                {configRows.map(({ label, value, key }) => (
                    <Box key={label}>
                        <Text bold color="white">{label}:</Text>
                        <Text> </Text>
                        <Text color={highlightConfig === key ? "yellow" : "magenta"}>{value}</Text>
                    </Box>
                ))}
            </Box>

            {/* Logs Section */}
            <Box flexDirection="column" borderStyle="round" borderColor="yellow" padding={1}>
                <Text underline color="yellow">📜 Logs</Text>
                {filteredLogs.map((log, idx) => (
                    <Box key={log.id}>
                        <Text color="gray">[{log.timestamp}]</Text>
                        <Text> </Text>
                        <Text color={log.type === "error" ? "red" : log.type === "success" ? "green" : log.type === "warning" ? "yellow" : "white"}>
                            <Text>{LOG_ICONS[log.type]}</Text>
                            <Text> </Text>
                            <Text dimColor={idx < filteredLogs.length - 3}>{log.message}</Text>
                        </Text>
                    </Box>
                ))}
                {filteredLogs.length === 0 && (
                    <Text color="gray">No logs yet.</Text>
                )}
            </Box>
        </Box>
    );
};

export default App;
