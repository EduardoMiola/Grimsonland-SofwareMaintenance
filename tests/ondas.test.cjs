const assert = require('assert');
const { teste } = require('./apoio.cjs');
const { monsterController, targetForWave, isSpecialWave, WAVE_SETTINGS } = require('../src/configs/rules/logic.ts');

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
        if (tipo === 'summonGate' || tipo === 'monsterBoss') {
          const portal = { tipo, setPosition(posicao) { this.posicao = posicao; } };
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
  assert.strictEqual(etiqueta.parameters.text, 'WAVE 2: 0/25');
});

teste('não avança a onda enquanto a meta de mortes não for atingida', () => {
  const { controlador, monstros, etiqueta } = criarControlador();
  monstros.push({});
  controlador.parameters.monsterSpawned = 10;
  controlador.parameters.monsterKilled = 9;
  monsterController.update(controlador);
  assert.strictEqual(controlador.parameters.currentWave, 1);
  assert.strictEqual(etiqueta.parameters.text, 'WAVE 1: 9/10');
});

teste('se os monstros desaparecerem antes de morrer, permite criá-los novamente', () => {
  const { controlador } = criarControlador();
  controlador.parameters.monsterSpawned = 10;
  controlador.parameters.monsterKilled = 8;
  monsterController.update(controlador);
  assert.strictEqual(controlador.parameters.monsterSpawned, 8);
  assert.strictEqual(controlador.parameters.currentWave, 1);
});


teste('a meta continua após a onda 12 e respeita o teto de segurança', () => {
  // A tabela original termina em 10.000; depois cresce 1.000 por onda até 25.000.
  assert.strictEqual(targetForWave(12), 10000);
  assert.strictEqual(targetForWave(13), 11000);
  assert.strictEqual(targetForWave(26), 24000);
  assert.strictEqual(targetForWave(27), 25000);
  assert.strictEqual(targetForWave(200), 25000);
  for (const invalida of [0, -1, 1.5, NaN]) {
    assert.throws(() => targetForWave(invalida), RangeError);
  }
});

teste('ao concluir a onda 12, a onda 13 recebe uma meta válida', () => {
  const { controlador, etiqueta } = criarControlador();
  controlador.parameters.currentWave = 12;
  controlador.parameters.monsterOnWave = 10000;
  controlador.parameters.monsterSpawned = 10000;
  controlador.parameters.monsterKilled = 10000;
  controlador.parameters.currentMonsterCooldown = 3;
  monsterController.update(controlador);
  assert.strictEqual(controlador.parameters.currentWave, 13);
  assert.strictEqual(controlador.parameters.monsterOnWave, 11000);
  assert.strictEqual(controlador.parameters.currentMonsterCooldown, 0);
  assert.strictEqual(etiqueta.parameters.text, 'WAVE 13: 0/11000');
});

teste('a cada cinco ondas o primeiro inimigo é um chefe que conta na meta', () => {
  assert.strictEqual(isSpecialWave(5), true);
  assert.strictEqual(isSpecialWave(6), false);
  const { controlador, monstros, portais } = criarControlador();
  controlador.parameters.currentWave = 5;
  controlador.parameters.monsterOnWave = targetForWave(5);
  monstros.push({});
  monsterController.update(controlador);
  assert.strictEqual(portais[0].tipo, 'monsterBoss');
  assert.strictEqual(controlador.parameters.monsterSpawned, 1);
  controlador.parameters.currentMonsterCooldown = 0;
  monsterController.update(controlador);
  assert.strictEqual(portais[1].tipo, 'summonGate');
});

teste('com 100 inimigos ou portais ativos, aguarda antes de gerar outro', () => {
  const { controlador, monstros, portais } = criarControlador();
  monstros.push(...Array(WAVE_SETTINGS.maxActiveMonsters).fill({}));
  monsterController.update(controlador);
  assert.strictEqual(portais.length, 0);
  monstros.pop();
  monsterController.update(controlador);
  assert.strictEqual(portais.length, 1);
});
