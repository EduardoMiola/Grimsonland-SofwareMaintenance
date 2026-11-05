const assert = require('assert');
const { teste, Point } = require('./apoio.cjs');
const { damageOnPlayerCollision, selectSpellWithKeyboard, spellExplosion } = require('../src/configs/rules/units.ts');
const { bulletMonsterCollision, fireball } = require('../src/configs/rules/spells.ts');

teste('ataque ao jogador reduz sua vida pela força do ataque', () => {
  // Preparar: um jogador com 50 de vida e um ataque com força 12.
  const jogador = { type: 'player', parameters: { health: 50 } };
  const ataque = { parameters: { power: 12 }, collisions: { objects: [jogador] } };
  // Agir e conferir: 50 - 12 = 38.
  damageOnPlayerCollision.update(ataque);
  assert.strictEqual(jogador.parameters.health, 38);
});

teste('ataque ao jogador ignora objetos que não são jogadores', () => {
  const monstro = { type: 'monster', parameters: { health: 50 } };
  const ataque = { parameters: { power: 12 }, collisions: { objects: [monstro] } };
  damageOnPlayerCollision.update(ataque);
  assert.strictEqual(monstro.parameters.health, 50);
});

teste('projétil causa dano ao monstro e é removido após o impacto', () => {
  const monstro = { type: 'monster', pos: new Point(10, 20), parameters: { health: 30 } };
  const removidos = [];
  const efeitos = [];
  const projetil = {
    id: 'projetil-1', parameters: { power: 7 }, collisions: { objects: [monstro] },
    layer: {
      addObjectByID(tipo) {
        efeitos.push(tipo);
        return { setPosition() {} };
      },
      removeObjectOnNextTick(id) { removidos.push(id); },
    },
  };
  bulletMonsterCollision.update(projetil);
  assert.strictEqual(monstro.parameters.health, 23);
  assert.deepStrictEqual(removidos, ['projetil-1']);
  assert.deepStrictEqual(efeitos, ['bloodSpray']);
});

teste('explosão de feitiço não machuca jogador e só aplica dano uma vez', () => {
  const jogador = { type: 'player', parameters: { health: 50 } };
  const monstro = { type: 'monster', parameters: { health: 30 } };
  const explosao = { parameters: { power: 8 }, collisions: { objects: [jogador, monstro] } };
  spellExplosion.update(explosao);
  spellExplosion.update(explosao);
  assert.strictEqual(jogador.parameters.health, 50);
  assert.strictEqual(monstro.parameters.health, 22);
  assert.strictEqual(explosao.parameters.exploded, true);
});

teste('teclas 1 a 4 selecionam os feitiços correspondentes', () => {
  // Cada rodada simula uma tecla pressionada e confere o feitiço escolhido.
  for (const [tecla, esperado] of [[49, 'fireball'], [50, 'hellfire'], [51, 'frostShard'], [52, 'teleport']]) {
    const jogador = {
      parameters: { currentSpell: 'nenhum' },
      layer: { game: { input: { keyboard: { isDown: codigo => codigo === tecla } } } },
    };
    selectSpellWithKeyboard.update(jogador);
    assert.strictEqual(jogador.parameters.currentSpell, esperado, `código da tecla: ${tecla}`);
  }
});

teste('fireball cria projéteis conforme o poder e respeita o intervalo de disparo', () => {
  // Preparar: poder 2 cria dois projéteis; o tempo entre disparos é 12.
  const jogador = { pos: new Point(50, 50), parameters: { spellPower: 2, currentSpell: 'fireball' } };
  const projeteis = [];
  const feitico = {
    parameters: { fireCooldown: 0 }, defaultParameters: { cooldown: 12 },
    layer: {
      translate: { x: 0, y: 0 },
      getObjectsByType() { return [jogador]; },
      game: { input: { mousePointer: { x: 100, y: 100, isDown: true }, keyboard: { isDown: () => false } } },
      addObjectByID(tipo) {
        assert.strictEqual(tipo, 'bullet');
        const projetil = { parameters: { power: 10 }, setPosition() {}, sprite: { setDegree() {} } };
        projeteis.push(projetil);
        return projetil;
      },
    },
  };
  // Agir: disparar e tentar disparar de novo no quadro seguinte.
  fireball.update(feitico);
  assert.strictEqual(projeteis.length, 2);
  assert.strictEqual(projeteis[0].parameters.power, 15);
  assert.strictEqual(feitico.parameters.fireCooldown, 12);
  fireball.update(feitico);
  // Conferir: não são criados projéteis extras durante o intervalo.
  assert.strictEqual(projeteis.length, 2);
  assert.strictEqual(feitico.parameters.fireCooldown, 11);
});
