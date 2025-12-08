import { build } from "esbuild";
import { createWriteStream, existsSync, mkdirSync } from "fs";
import archiver from "archiver";
import path from "path";

export interface BuilderConfig {
    mainEntry?: string;
    extraFiles?: string[];
}

export async function buildPlugin(
    pluginDir: string,
    outDir: string,
    config?: BuilderConfig
): Promise<string> {
    const pluginName = path.basename(pluginDir);
    const outFile = path.join(outDir, "main.js");
    const zipFile = path.join(outDir, "dist.zip");

    if (!existsSync(pluginDir)) {
        throw new Error(`Plugin directory not found at ${pluginDir}`);
    }

    try {
        // Use config mainEntry if provided, otherwise fallback to default search
        let mainEntry = config?.mainEntry
            ? path.resolve(pluginDir, config.mainEntry)
            : path.join(pluginDir, "main.ts");

        if (!existsSync(mainEntry)) {
            mainEntry = path.join(pluginDir, "main.js");
        }
        if (!existsSync(mainEntry)) {
            mainEntry = path.join(pluginDir, "main.tsx");
        }

        if (!existsSync(mainEntry)) {
            throw new Error(
                `No main entry point found in ${pluginDir} (checked main.ts, main.js, main.tsx, config.mainEntry)`
            );
        }

        await build({
            entryPoints: [mainEntry],
            bundle: true,
            outfile: outFile,
            minify: true,
            format: "esm",
            loader: { ".css": "text", ".wasm": "binary" },
            conditions: ["style"],
            globalName: "plugin",
        });

        if (!existsSync(outDir)) {
            mkdirSync(outDir, { recursive: true });
        }

        return new Promise((resolve, reject) => {
            const output = createWriteStream(zipFile);
            const archive = archiver("zip", { zlib: { level: 9 } });

            output.on("close", () => resolve(zipFile));
            archive.on("error", (err) => reject(err));
            archive.pipe(output);

            archive.file(outFile, { name: "main.js" });

            // Always include icon, plugin.json, readme if present
            ["icon.png", "plugin.json", "readme.md"].forEach((file) => {
                const filePath = path.join(pluginDir, file);
                if (existsSync(filePath)) archive.file(filePath, { name: file });
            });

            // Add extra files from config
            if (config?.extraFiles) {
                config.extraFiles.forEach((file) => {
                    const filePath = path.resolve(pluginDir, file);
                    if (existsSync(filePath)) {
                        archive.file(filePath, { name: path.basename(file) });
                    }
                });
            }

            archive.finalize();
        });
    } catch (err) {
        console.error(err);
        throw err;
    }
}
