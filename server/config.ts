import { existsSync, readFileSync } from "fs";
import path from "path";

export interface HotReloadConfig {
    mainEntry?: string;
    extraFiles?: string[];
    debounce?: number;
    [key: string]: any;
}

/**
 * Loads config from a JSON file, merging with CLI options.
 * @param pluginDir Directory of the plugin
 * @param configPath Optional path to hot.reload.json
 * @param cliOptions Additional CLI options to override config file
 */
export function loadConfig(
    pluginDir: string,
    configPath?: string,
    cliOptions?: Partial<HotReloadConfig>
): HotReloadConfig {
    let configFile = configPath
        ? path.resolve(process.cwd(), configPath)
        : path.join(pluginDir, "hot.reload.json");

    let fileConfig: HotReloadConfig = {};
    if (existsSync(configFile)) {
        try {
            fileConfig = JSON.parse(readFileSync(configFile, "utf8"));
        } catch (e) {
            console.error("Failed to load config:", e);
        }
    }

    // Merge CLI options (if provided) over file config
    return {
        ...fileConfig,
        ...cliOptions,
    };
}
