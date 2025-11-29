import JSZip from "jszip";

const Url = acode.require("url");
const fsOperation = acode.require("fsoperation");
const loader = acode.require("loader");
const helpers = acode.require("helpers");
const Page = acode.require("page");
const actionStack = acode.require("actionstack");

// Assuming PLUGIN_DIR and DATA_STORAGE are global as in Acode environment
declare const PLUGIN_DIR: string;
declare const DATA_STORAGE: string;


export default async function loadPlugin(pluginId: string, justInstalled = false) {
  const baseUrl = await helpers.toInternalUri(Url.join(PLUGIN_DIR, pluginId)!);
  const cacheFile = Url.join(CACHE_STORAGE, pluginId);
  const $script = tag("script", {
    src: Url.join(baseUrl, "main.js"),
  });
  document.head.append($script);
  return new Promise((resolve) => {
    $script.onload = async () => {
      const $page = Page("Plugin");
      $page.show = () => {
        actionStack.push({
          id: pluginId,
          action: $page.hide,
        });

        // @ts-expect-error
        app.append($page);
      };

      $page.onhide = function () {
        actionStack.remove(pluginId);
      };

      if (!(await fsOperation(cacheFile).exists())) {
        await fsOperation(CACHE_STORAGE).createFile(pluginId, "");
      }
      
      // @ts-expect-error
      await acode.initPlugin(pluginId, baseUrl, $page, {
        cacheFileUrl: await helpers.toInternalUri(cacheFile),
        cacheFile: fsOperation(cacheFile),
        firstInit: justInstalled,
      });
      
      
      resolve(true);
    };
  });
}


export async function installPluginZip(zipContent: string) {
    const zip = new JSZip();
    await zip.loadAsync(zipContent, { base64: true });

    if (!zip.files['plugin.json'] || !zip.files['main.js']) {
        throw new Error("Invalid plugin: missing plugin.json or main.js");
    }

    const pluginJson = JSON.parse(await zip.files['plugin.json'].async('text'));
    const id = pluginJson.id;
    const pluginDir = Url.join(PLUGIN_DIR, id);

    if (!await fsOperation(pluginDir).exists()) {
        if (!await fsOperation(PLUGIN_DIR).exists()) {
            await fsOperation(DATA_STORAGE).createDirectory('plugins');
        }
        await fsOperation(PLUGIN_DIR).createDirectory(id);
    }

    const promises = Object.keys(zip.files).map(async (file) => {
        let correctFile = file;
        if (/\\/.test(correctFile)) {
            correctFile = correctFile.replace(/\\/g, '/');
        }

        const fileUrl = Url.join(pluginDir, correctFile);
        if (!await fsOperation(fileUrl).exists()) {
            await createFileRecursive(pluginDir, correctFile);
        }

        if (correctFile.endsWith('/')) return;

        let data: string | ArrayBuffer = await zip.files[file].async('arraybuffer');

        if (file === 'plugin.json') {
            // Ensure consistent formatting or modifications if needed
            data = JSON.stringify(pluginJson);
        }

        await fsOperation(fileUrl).writeFile(data);
    });

    await Promise.all(promises);

    // Reload the plugin
    try {
        acode.unmountPlugin(id);
    } catch (e) {
        console.warn("Failed to unmount plugin (might not be loaded)", e);
    }
    await loadPlugin(id);

    return id;
}

async function createFileRecursive(parent: string, dir: string | string[]) {
    let isDir = false;
    if (typeof dir === 'string') {
        if (dir.endsWith('/')) {
            isDir = true;
            dir = dir.slice(0, -1);
        }
        dir = dir.split('/');
    }
    dir = dir.filter(d => d);
    const cd = dir.shift();
    if (!cd) return;

    const newParent = Url.join(parent, cd);
    if (!(await fsOperation(newParent).exists())) {
        if (dir.length || isDir) {
            await fsOperation(parent).createDirectory(cd);
        } else {
            await fsOperation(parent).createFile(cd, "");
        }
    }
    if (dir.length) {
        await createFileRecursive(newParent, dir);
    }
}
