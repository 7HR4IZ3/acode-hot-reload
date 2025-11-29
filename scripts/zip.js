const fs = require('fs');
const archiver = require('archiver');
const path = require('path');

const distDir = path.join(__dirname, '../dist');
const pluginDir = path.join(__dirname, '../');
const zipFile = path.join(distDir, 'plugin.zip');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

const output = fs.createWriteStream(zipFile);
const archive = archiver('zip', {
  zlib: { level: 9 }
});

output.on('close', function() {
  console.log(archive.pointer() + ' total bytes');
  console.log('Plugin zipped to ' + zipFile);
});

archive.on('error', function(err) {
  throw err;
});

archive.pipe(output);

// Add main.js
archive.file(path.join(distDir, 'main.js'), { name: 'main.js' });

// Add plugin.json
archive.file(path.join(pluginDir, 'plugin.json'), { name: 'plugin.json' });

// Add icon.png
if (fs.existsSync(path.join(pluginDir, 'icon.png'))) {
  archive.file(path.join(pluginDir, 'icon.png'), { name: 'icon.png' });
}

// Add readme.md
if (fs.existsSync(path.join(pluginDir, 'readme.md'))) {
  archive.file(path.join(pluginDir, 'readme.md'), { name: 'readme.md' });
}

archive.finalize();
