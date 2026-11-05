// Apoio para executar os arquivos TypeScript do jogo no Node, sem abrir o navegador.
// O jogo continua usando o Phaser real; esta simulação existe somente nos testes.
const fs = require('fs');
const Module = require('module');
const ts = require('typescript');

class Point {
  constructor(x = 0, y = 0) { this.x = x; this.y = y; }
  clone() { return new Point(this.x, this.y); }
  angle() { return 0; }
  rotate() { return this; }
  static subtract(a, b) { return new Point(a.x - b.x, a.y - b.y); }
}
class Rectangle {
  constructor() { this.randomX = 300; this.randomY = 300; }
}
const phaserSimulado = { Point, Rectangle, State: class State {} };
const carregarOriginal = Module._load;
Module._load = function (pedido, origem, ...resto) {
  if (pedido === 'phaser') return phaserSimulado;
  // Battle importa o motor inteiro para jogar. Para testar só os recordes,
  // não precisamos inicializar gráficos, áudio ou camadas do Phaser.
  if (origem && origem.filename.endsWith('/states/battle.ts')) {
    if (pedido === '../engine') return {};
    if (pedido === '../configs/rules/layers') return {};
  }
  return carregarOriginal.call(this, pedido, origem, ...resto);
};
require.extensions['.ts'] = function (modulo, arquivo) {
  const codigo = fs.readFileSync(arquivo, 'utf8');
  const javascript = ts.transpileModule(codigo, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019, esModuleInterop: true },
  }).outputText;
  modulo._compile(javascript, arquivo);
};

// Cada cenário recebe um nome em português e aparece no resultado do comando.
let quantidade = 0;
function teste(descricao, executar) {
  try {
    executar();
    quantidade++;
    console.log(`  ✓ ${descricao}`);
  } catch (erro) {
    console.error(`  ✗ ${descricao}`);
    throw erro;
  }
}
function total() { return quantidade; }
module.exports = { teste, total, Point };
