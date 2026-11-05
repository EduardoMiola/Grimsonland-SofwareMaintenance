const assert = require('assert');
const { teste } = require('./apoio.cjs');
const { Battle } = require('../src/states/battle.ts');

// Monta uma batalha pequena com as funções externas registrando o que acontece.
function criarBatalha() {
  const eventos = [];
  const batalha = new Battle();
  batalha.pauseFlag = false;
  batalha.playerPaused = false;
  batalha.gameOver = false;
  batalha.pauseMenu = { visible: false };
  batalha.audioText = { text: '' };
  batalha.sound = {
    mute: false,
    pauseAll() { eventos.push('pausar áudio'); },
    resumeAll() { eventos.push('retomar áudio'); },
    stopAll() { eventos.push('parar áudio'); },
  };
  batalha.battleTheme = { play() { eventos.push('tocar música'); }, stop() { eventos.push('parar música'); } };
  batalha.deathTheme = { stop() {} };
  batalha.restartButton = { kill() {} };
  batalha.restartText = { kill() {} };
  batalha.collisions = { clear() { eventos.push('limpar colisões'); } };
  batalha.gameLayer = {
    update() { eventos.push('atualizar jogo'); },
    render(tempo) { eventos.push(`desenhar ${tempo}`); },
    clearLayer() { eventos.push('limpar partida'); },
    init() { eventos.push('iniciar partida'); },
  };
  batalha.bitmap = { rect() {} };
  batalha.game = {
    width: 1024, height: 768, canvas: { width: 1024, height: 768 },
    time: { physicsElapsed: 0.1 },
    renderer: { view: { classList: { add() {}, remove() {} } } },
    state: { start(nome) { eventos.push(`abrir ${nome}`); } },
  };
  return { batalha, eventos };
}

teste('pausar congela a atualização e retomar continua a mesma partida', () => {
  const { batalha, eventos } = criarBatalha();
  batalha.pauseGame();
  batalha.prepareForRender();
  assert.strictEqual(batalha.pauseMenu.visible, true);
  assert.ok(eventos.includes('pausar áudio'));
  assert.ok(!eventos.includes('atualizar jogo'));
  batalha.resumeGame();
  batalha.prepareForRender();
  assert.strictEqual(batalha.pauseMenu.visible, false);
  assert.ok(eventos.includes('retomar áudio'));
  assert.ok(eventos.includes('atualizar jogo'));
  assert.ok(!eventos.includes('limpar partida'));
});

teste('controle de áudio alterna entre ligado e desligado durante a pausa', () => {
  const { batalha } = criarBatalha();
  batalha.pauseGame();
  batalha.toggleAudio();
  assert.strictEqual(batalha.sound.mute, true);
  assert.strictEqual(batalha.audioText.text, 'AUDIO: OFF');
  batalha.toggleAudio();
  assert.strictEqual(batalha.sound.mute, false);
  assert.strictEqual(batalha.audioText.text, 'AUDIO: ON');
});

teste('reiniciar pela pausa limpa o jogo e começa uma nova partida', () => {
  const { batalha, eventos } = criarBatalha();
  batalha.pauseGame();
  batalha.restartFromPause();
  assert.strictEqual(batalha.pauseFlag, false);
  assert.strictEqual(batalha.pauseMenu.visible, false);
  assert.ok(eventos.includes('parar áudio'));
  assert.ok(eventos.includes('limpar colisões'));
  assert.ok(eventos.includes('limpar partida'));
  assert.ok(eventos.includes('iniciar partida'));
});

teste('voltar ao menu durante a pausa para o áudio e abre o menu inicial', () => {
  const { batalha, eventos } = criarBatalha();
  batalha.pauseGame();
  batalha.returnToMenu();
  assert.ok(eventos.includes('parar áudio'));
  assert.ok(eventos.includes('abrir MainMenu'));
});

teste('não é possível abrir pausa após o fim da partida', () => {
  const { batalha, eventos } = criarBatalha();
  batalha.gameOver = true;
  batalha.togglePause();
  assert.strictEqual(batalha.pauseMenu.visible, false);
  assert.ok(!eventos.includes('pausar áudio'));
});
