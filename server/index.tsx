#!/usr/bin/env node

import React from "react";
import { render } from "ink";
import { Command } from "commander";
import path from "path";
import App from "./ui";
import { Watcher } from "./watcher";
import { SocketServer } from "./socket";
import * as builder from "./builder";
import { existsSync, readFileSync } from "fs";

// Config interface
interface HotReloadConfig {
    mainEntry?: string;
    extraFiles?: string[];
    debounce?: number;
    [key: string]: any;
}

// Load config from file
function loadConfig(pluginDir: string, configPath?: string): HotReloadConfig {
    let configFile = configPath
        ? path.resolve(process.cwd(), configPath)
        : path.join(pluginDir, "hot.reload.json");

    if (!existsSync(configFile)) return {};

    try {
        return JSON.parse(readFileSync(configFile, "utf8"));
    } catch (e) {
        console.error("Failed to load config:", e);
        return {};
    }
}

// CLI setup
const program = new Command();
program
    .argument("[pluginDir]", "Path to plugin directory")
    .option("-p, --port <port>", "Port to run the server on", "3000")
    .option("-c, --config <path>", "Path to hot.reload.json config file")
    .option("--main-entry <file>", "Main entry file for plugin")
    .option("--extra-files <files...>", "Extra files to include in zip")
    .option("--debounce <ms>", "Debounce time for watcher in ms")
    .parse(process.argv);

const opts = program.opts();
const targetDir = program.args[0]
    ? path.resolve(process.cwd(), program.args[0])
    : process.cwd();

// Load config from file (if exists)
const fileConfig: HotReloadConfig = loadConfig(targetDir, opts.config);

// Merge CLI options into config, CLI takes precedence
const config: HotReloadConfig = {
    ...fileConfig,
    ...(opts.mainEntry ? { mainEntry: opts.mainEntry } : {}),
    ...(opts.extraFiles ? { extraFiles: opts.extraFiles } : {}),
    ...(opts.debounce ? { debounce: Number(opts.debounce) } : {}),
};

// Instantiate watcher and socket with config
const watcher = new Watcher(targetDir, config.debounce);
const socket = new SocketServer(Number(opts.port));

// Render Ink UI
render(
    <App
        watcher={watcher}
        socket={socket}
        builder={builder}
        targetDir={targetDir}
        config={config}
    />
);
