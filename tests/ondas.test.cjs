const assert = require('assert');
const { teste } = require('./apoio.cjs');
const { monsterController } = require('../src/configs/rules/logic.ts');

// A camada simulada guarda os objetos criados e o texto mostrado na tela.
function criarControlador() {
  const etiqueta = { id: 'placar', parameters: {} };
  const portais = [];
  const monstros = [];
  const controlador = {
    parameters: {},
    layer: {
      translate: { x: 0, y: 0 },
      addObjectByID(tipo) {
        if (tipo === 'leftOnWaveLabel') return etiqueta;
        if (tipo === 'summonGate') {
          const portal = { setPosition(posicao) { this.posicao = posicao; } };
          portais.push(portal);
          return portal;
        }
        throw new Error(`Objeto inesperado: ${tipo}`);
      },
      getObjectsByType() { return monstros; },
      getObjectByID() { return etiqueta; },
    },
  };
  monsterController.init(controlador);
  return { controlador, etiqueta, portais, monstros };
}

teste('a primeira onda começa com meta de 10 monstros', () => {
  const { controlador } = criarControlador();
  assert.strictEqual(controlador.parameters.currentWave, 1);
  assert.strictEqual(controlador.parameters.monsterOnWave, 10);
  assert.strictEqual(controlador.parameters.monsterKilled, 0);
  assert.strictEqual(controlador.parameters.monsterSpawned, 0);
});

teste('cria um portal e espera o intervalo antes de criar outro', () => {
  const { controlador, portais, monstros } = criarControlador();
  // Simula um monstro presente para o controlador não repor os já desaparecidos.
  monstros.push({});
  monsterController.update(controlador);
  assert.strictEqual(portais.length, 1);
  assert.strictEqual(controlador.parameters.monsterSpawned, 1);
  assert.strictEqual(controlador.parameters.currentMonsterCooldown, 10);
  monsterController.update(controlador);
  assert.strictEqual(portais.length, 1);
  assert.strictEqual(controlador.parameters.currentMonsterCooldown, 9);
});

teste('ao completar a primeira onda, inicia a segunda com meta de 25', () => {
  const { controlador, etiqueta } = criarControlador();
  // Preparar: os 10 monstros da primeira onda já foram criados e derrotados.
  controlador.parameters.monsterSpawned = 10;
  controlador.parameters.monsterKilled = 10;
  monsterController.update(controlador);
  assert.strictEqual(controlador.parameters.currentWave, 2);
  assert.strictEqual(controlador.parameters.monsterOnWave, 25);
  assert.strictEqual(controlador.parameters.monsterSpawned, 0);
  assert.strictEqual(controlador.parameters.monsterKilled, 0);
  assert.strictEqual(etiqueta.parameters.text, 'LEFT ON THIS WAVE: 0/25');
});

teste('não avança a onda enquanto a meta de mortes não for atingida', () => {
  const { controlador, monstros, etiqueta } = criarControlador();
  monstros.push({});
  controlador.parameters.monsterSpawned = 10;
  controlador.parameters.monsterKilled = 9;
  monsterController.update(controlador);
  assert.strictEqual(controlador.parameters.currentWave, 1);
  assert.strictEqual(etiqueta.parameters.text, 'LEFT ON THIS WAVE: 9/10');
});

teste('se os monstros desaparecerem antes de morrer, permite criá-los novamente', () => {
  const { controlador } = criarControlador();
  controlador.parameters.monsterSpawned = 10;
  controlador.parameters.monsterKilled = 8;
  monsterController.update(controlador);
  assert.strictEqual(controlador.parameters.monsterSpawned, 8);
  assert.strictEqual(controlador.parameters.currentWave, 1);
});
