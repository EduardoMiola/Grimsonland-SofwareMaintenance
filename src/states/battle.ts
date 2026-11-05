import Phaser from 'phaser';

import { bootstrapCollisions, GameLayer } from '../engine';
import {
  randomTrees,
  spawnExp,
  spawnHeart,
  goWithPlayer,
} from '../configs/rules/layers';

import type { GameLayerConfig } from '../engine';

const LAYER_CONFIG: Omit<GameLayerConfig, 'ctx' | 'state' | 'init'> = {
  id: 'mainLayer',
  size: [1324, 1068],
  background: 'terrain',
  initList: [
    'player',
    'cursor',
    'counter',
    'timer',
    'bestTime',
    'fireballSpell',
    'hellfireSpell',
    'frostShardSpell',
    'teleportSpell',
    'bestScore',
    'level',
    'fog',
    'monsterController',
  ],
  translate: {
    x: -150,
    y: -150,
  },
  rules: [randomTrees, spawnExp, spawnHeart, goWithPlayer],
};

export class Battle extends Phaser.State {
  private battleTheme!: Phaser.Sound;
  private deathTheme!: Phaser.Sound;

  private restartButton!: Phaser.Button;
  private restartText!: Phaser.Text;

  private bitmap!: Phaser.BitmapData;
  private gameLayer!: GameLayer;
  collisions!: ReturnType<typeof bootstrapCollisions>;

  parameters!: {
    bestTime: number;
    gameTimer: number;
    monstersKilled: number;
    bestScore: number;
  };

  private pauseFlag!: boolean;
  private playerPaused = false;
  private gameOver = false;
  private pauseMenu!: Phaser.Group;
  private audioText!: Phaser.Text;
  private pauseKeys: Phaser.Key[] = [];

  init() {
    this.battleTheme = this.sound.add('battleTheme', 0.3, true);
    this.deathTheme = this.sound.add('deathTheme', 0.3, true);
  }

  create() {
    this.pauseFlag = false;
    this.playerPaused = false;
    this.gameOver = false;

    this.collisions = bootstrapCollisions({
      n: 6,
      width: 1500,
      height: 1200,
    });

    this.initGameParameters();
    this.initGameLayer();
    this.initControls();
    this.initPauseControls();

    this.game.renderer.view.classList.add('no-pointer');
    this.battleTheme.play();
  }

  initPauseControls() {
    this.pauseMenu = this.add.group();
    const backdrop = this.add.graphics(0, 0);
    backdrop.beginFill(0x000000, 0.8);
    backdrop.drawRect(0, 0, this.game.width, this.game.height);
    backdrop.endFill();
    this.pauseMenu.add(backdrop);

    const title = this.add.text(this.game.width / 2, 210, 'PAUSED', {
      fontSize: '42px', fill: '#ffffff',
    });
    title.anchor.setTo(0.5, 0.5);
    this.pauseMenu.add(title);

    const option = (label: string, y: number, action: () => void) => {
      const text = this.add.text(this.game.width / 2, y, label, {
        fontSize: '26px', fill: '#ffffff',
      });
      text.anchor.setTo(0.5, 0.5);
      text.inputEnabled = true;
      text.events.onInputDown.add(action, this);
      this.pauseMenu.add(text);
      return text;
    };
    option('RESUME', 300, this.resumeGame);
    option('RESTART', 350, this.restartFromPause);
    option('MAIN MENU', 400, this.returnToMenu);
    this.audioText = option('', 450, this.toggleAudio);
    this.updateAudioLabel();
    this.pauseMenu.visible = false;

    const keyboard = this.game.input.keyboard;
    this.pauseKeys = [keyboard.addKey(Phaser.Keyboard.P), keyboard.addKey(Phaser.Keyboard.ESC)];
    this.pauseKeys.forEach((key) => key.onDown.add(this.togglePause, this));
    keyboard.addKeyCapture([Phaser.Keyboard.P, Phaser.Keyboard.ESC]);
  }

  togglePause() {
    if (this.gameOver) return;
    if (this.playerPaused) this.resumeGame();
    else this.pauseGame();
  }

  pauseGame() {
    if (this.gameOver || this.playerPaused) return;
    this.playerPaused = true;
    this.pauseFlag = true;
    this.sound.pauseAll();
    this.pauseMenu.visible = true;
    this.game.renderer.view.classList.remove('no-pointer');
  }

  resumeGame() {
    if (!this.playerPaused || this.gameOver) return;
    this.playerPaused = false;
    this.pauseFlag = false;
    this.pauseMenu.visible = false;
    this.sound.resumeAll();
    this.game.renderer.view.classList.add('no-pointer');
  }

  restartFromPause() {
    if (!this.playerPaused) return;
    this.resumeGame();
    this.sound.stopAll();
    this.restart();
  }

  returnToMenu() {
    if (!this.playerPaused) return;
    this.sound.stopAll();
    this.playerPaused = false;
    this.game.state.start('MainMenu');
  }

  toggleAudio() {
    this.sound.mute = !this.sound.mute;
    this.updateAudioLabel();
  }

  updateAudioLabel() {
    this.audioText.text = this.sound.mute ? 'AUDIO: OFF' : 'AUDIO: ON';
  }

  shutdown() {
    this.pauseKeys.forEach((key) => key.onDown.remove(this.togglePause, this));
    this.pauseKeys = [];
    this.game.input.keyboard.removeKeyCapture(Phaser.Keyboard.P);
    this.game.input.keyboard.removeKeyCapture(Phaser.Keyboard.ESC);
    this.game.renderer.view.classList.remove('no-pointer');
  }

  initControls() {
    this.restartButton = this.add.button(
      512,
      384,
      'button',
      this.restart,
      this,
      2,
      0,
      1,
      2
    );

    this.restartText = this.add.text(510, 335, 'YOU DIED!', {
      fill: '#EF0000',
    });
    this.restartText.anchor.setTo(0.5, 0.5);
    this.restartText.kill();

    this.restartButton.addChild(
      this.add.text(-65, -15, 'RESTART', {
        fill: '#efefef',
      })
    );
    this.restartButton.anchor.setTo(0.5, 0.5);
    this.restartButton.kill();
  }

  initGameParameters() {
    const bestTimeFromStorage = localStorage.getItem('bestTime');
    const bestScoreFromStorage = localStorage.getItem('bestScore');
    this.parameters = {
      monstersKilled: 0,
      gameTimer: 0,
      bestTime: bestTimeFromStorage ? parseInt(bestTimeFromStorage) || 0 : 0,
      bestScore: bestScoreFromStorage ? parseInt(bestScoreFromStorage) || 0 : 0,
    };
  }

  initGameLayer() {
    this.bitmap = this.add.bitmapData(
      this.game.canvas.width,
      this.game.canvas.height,
      'battleBitmap'
    );

    this.add.image(0, 0, this.bitmap);

    this.gameLayer = new GameLayer({
      ...LAYER_CONFIG,
      init() {
        this.state.parameters.monstersKilled = 0;
        this.state.parameters.gameTimer = 0;
      },
      state: this,
      ctx: this.bitmap.ctx,
    });
    this.gameLayer.init();
  }

  stopBattle() {
    this.gameOver = true;
    this.updateBestScores();
    this.battleTheme.stop();
    this.deathTheme.play();

    this.restartButton.revive();
    this.restartText.revive();
    this.game.renderer.view.classList.remove('no-pointer');

    this.pauseFlag = true;
  }

  updateBestScores() {
    if (this.parameters.gameTimer > this.parameters.bestTime) {
      this.parameters.bestTime = this.parameters.gameTimer;

      localStorage.setItem('bestTime', this.parameters.bestTime.toString());
    }
    if (this.parameters.monstersKilled > this.parameters.bestScore) {
      this.parameters.bestScore = this.parameters.monstersKilled;

      localStorage.setItem('bestScore', this.parameters.bestScore.toString());
    }
  }

  prepareForRender() {
    if (this.pauseFlag === true) {
      this.gameLayer.render(0);
      this.bitmap.rect(
        0,
        0,
        this.game.canvas.width,
        this.game.canvas.height,
        'rgba(10,0,0,0.5)'
      );
    } else {
      this.gameLayer.update(this.game.time.physicsElapsed);
      this.gameLayer.render(this.game.time.physicsElapsed);
    }
  }

  restart() {
    this.pauseFlag = false;
    this.playerPaused = false;
    this.gameOver = false;
    this.pauseMenu.visible = false;

    this.battleTheme.play();
    this.deathTheme.stop();

    this.collisions.clear();

    this.restartButton.kill();
    this.restartText.kill();
    this.game.renderer.view.classList.add('no-pointer');

    this.gameLayer.clearLayer();
    this.gameLayer.init();
  }

  update() {
    this.prepareForRender();
  }
}
