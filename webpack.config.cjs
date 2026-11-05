const path = require('path');

// Gera o jogo para o navegador. Os testes continuam sendo executados pelo Node.
module.exports = {
  mode: 'development',
  entry: path.join(__dirname, 'src/index.ts'),
  output: { path: path.join(__dirname, 'dist'), filename: 'game.bundle.js' },
  resolve: { extensions: ['.ts', '.js'] },
  module: {
    rules: [{
      test: /\.ts$/,
      exclude: /node_modules/,
      use: [{ loader: 'ts-loader', options: { transpileOnly: true } }],
    }],
  },
  externals: { phaser: 'Phaser' },
};
