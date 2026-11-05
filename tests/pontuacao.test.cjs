const assert = require('assert');
const { teste, Point } = require('./apoio.cjs');
const { monsterHealthStatus } = require('../src/configs/rules/units.ts');

function criarCenario(vida) {
  const jogador = { parameters: { exp: 5 } };
  const controlador = { parameters: { monsterKilled: 2 } };
  const removidos = [];
  const efeitos = [];
  const camada = {
    state: { parameters: { monstersKilled: 7 } },
    removeObjectOnNextTick(id) { removidos.push(id); },
    addObjectByID(tipo) {
      efeitos.push(tipo);
      return { setPosition() {} };
    },
    getObjectsByType(tipo) {
      if (tipo === 'controller') return [controlador];
      if (tipo === 'player') return [jogador];
      throw new Error(`Tipo inesperado: ${tipo}`);
    },
  };
  const monstro = { id: 'monstro-1', pos: new Point(20, 30), parameters: { health: vida, exp: 3 }, layer: camada };
  return { monstro, jogador, controlador, camada, removidos, efeitos };
}

teste('derrotar um monstro aumenta a pontuação, a contagem da onda e a experiência', () => {
  // Preparar: já existem 7 mortes no total, 2 na onda e 5 pontos de experiência.
  const cenario = criarCenario(0);
  // Agir: executar a regra de vida do monstro após a vida chegar a zero.
  monsterHealthStatus.update(cenario.monstro);
  // Conferir: uma morte é adicionada em cada contador e o jogador recebe 3 de experiência.
  assert.strictEqual(cenario.camada.state.parameters.monstersKilled, 8);
  assert.strictEqual(cenario.controlador.parameters.monsterKilled, 3);
  assert.strictEqual(cenario.jogador.parameters.exp, 8);
  assert.deepStrictEqual(cenario.removidos, ['monstro-1']);
  assert.deepStrictEqual(cenario.efeitos, ['explosion', 'blood']);
});

teste('um monstro vivo não aumenta pontuação nem é removido', () => {
  const cenario = criarCenario(1);
  monsterHealthStatus.update(cenario.monstro);
  assert.strictEqual(cenario.camada.state.parameters.monstersKilled, 7);
  assert.strictEqual(cenario.controlador.parameters.monsterKilled, 2);
  assert.strictEqual(cenario.jogador.parameters.exp, 5);
  assert.deepStrictEqual(cenario.removidos, []);
});
