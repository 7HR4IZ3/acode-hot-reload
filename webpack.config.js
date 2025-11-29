```javascript
const { exec } = require('child_process');
const path = require('path');

module.exports = (env, options) => {
  const { mode = 'development' } = options;
  const rules = [
    {
      test: /\.tsx?$/,
      use: 'ts-loader',
      exclude: /node_modules/,
    },
    {
      test: /\.m?js$/,
      use: [
        'html-tag-js/jsx/tag-loader.js',
        {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      ],
    },
  ];

  const main = {
    mode,
    entry: {
      main: './src/main.ts',
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      chunkFilename: '[name].js',
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
    },
    module: {
      rules,
    },
    plugins: [
      {
        apply: (compiler) => {
          compiler.hooks.afterDone.tap('pack-zip', () => {
            // run pack-zip.js
            exec('node .vscode/pack-zip.js', (err, stdout, stderr) => {
              if (err) {
                console.error(err);
                return;
              }
              console.log(stdout);
            });
          });
        }
      }
    ],
  };

  return [main];
}
```