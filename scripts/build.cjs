const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const config = require('../webpack.config.cjs');
const raiz = path.join(__dirname, '..');
const destino = path.join(raiz, 'dist');

function copiarPasta(origem, destinoPasta) {
  fs.mkdirSync(destinoPasta, { recursive: true });
  for (const entrada of fs.readdirSync(origem, { withFileTypes: true })) {
    const fonte = path.join(origem, entrada.name);
    const alvo = path.join(destinoPasta, entrada.name);
    if (entrada.isDirectory()) copiarPasta(fonte, alvo);
    else fs.copyFileSync(fonte, alvo);
  }
}

webpack(config, (erro, resultado) => {
  if (erro || resultado.hasErrors()) {
    console.error(erro || resultado.toString({ all: false, errors: true }));
    process.exitCode = 1;
    return;
  }
  copiarPasta(path.join(raiz, 'src/assets'), path.join(destino, 'assets'));
  fs.copyFileSync(path.join(raiz, 'src/index.html'), path.join(destino, 'index.html'));
  console.log('Jogo gerado em dist/. Use npm run servir para abrir no navegador.');
});
