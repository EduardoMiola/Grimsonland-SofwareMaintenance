const assert = require('assert');
const { teste } = require('./apoio.cjs');
const { Battle } = require('../src/states/battle.ts');

// Substitui o armazenamento do navegador por um objeto temporário de teste.
function armazenamentoInicial(valores = {}) {
  const dados = { ...valores };
  return {
    getItem(chave) { return Object.prototype.hasOwnProperty.call(dados, chave) ? dados[chave] : null; },
    setItem(chave, valor) { dados[chave] = String(valor); },
    dados,
  };
}

teste('ao iniciar, carrega os recordes salvos e zera os dados da partida', () => {
  global.localStorage = armazenamentoInicial({ bestTime: '90', bestScore: '15' });
  const batalha = new Battle();
  batalha.initGameParameters();
  assert.deepStrictEqual(batalha.parameters, { monstersKilled: 0, gameTimer: 0, bestTime: 90, bestScore: 15 });
});

teste('sem recordes válidos, começa com zero', () => {
  global.localStorage = armazenamentoInicial({ bestTime: 'inválido' });
  const batalha = new Battle();
  batalha.initGameParameters();
  assert.strictEqual(batalha.parameters.bestTime, 0);
  assert.strictEqual(batalha.parameters.bestScore, 0);
});

teste('ao superar os recordes, salva tempo e pontuação no armazenamento', () => {
  global.localStorage = armazenamentoInicial({ bestTime: '90', bestScore: '15' });
  const batalha = new Battle();
  batalha.initGameParameters();
  batalha.parameters.gameTimer = 100;
  batalha.parameters.monstersKilled = 20;
  batalha.updateBestScores();
  assert.strictEqual(batalha.parameters.bestTime, 100);
  assert.strictEqual(batalha.parameters.bestScore, 20);
  assert.strictEqual(global.localStorage.getItem('bestTime'), '100');
  assert.strictEqual(global.localStorage.getItem('bestScore'), '20');
});

teste('uma partida com resultado igual ou menor não apaga os recordes', () => {
  global.localStorage = armazenamentoInicial({ bestTime: '90', bestScore: '15' });
  const batalha = new Battle();
  batalha.initGameParameters();
  batalha.parameters.gameTimer = 90;
  batalha.parameters.monstersKilled = 3;
  batalha.updateBestScores();
  assert.strictEqual(global.localStorage.getItem('bestTime'), '90');
  assert.strictEqual(global.localStorage.getItem('bestScore'), '15');
});
