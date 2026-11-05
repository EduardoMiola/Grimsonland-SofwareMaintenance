import Phaser from 'phaser';

import { ObjectTypes } from '../objects/constants';
import type { GameObject, GameRule } from '../../engine';

// Mantém as primeiras ondas do jogo original e calcula as seguintes.
const ORIGINAL_WAVE_TARGETS = [10, 25, 50, 75, 100, 150, 200, 500, 1000, 2500, 5000, 10000];
export const WAVE_SETTINGS = {
  extraMonstersPerWave: 1000,
  maxMonstersPerWave: 25000,
  maxActiveMonsters: 100,
  specialWaveInterval: 5,
  spawnCooldown: 10,
};

export function targetForWave(wave: number): number {
  if (!Number.isInteger(wave) || wave < 1) {
    throw new RangeError('A onda deve ser um número inteiro positivo.');
  }
  if (wave <= ORIGINAL_WAVE_TARGETS.length) return ORIGINAL_WAVE_TARGETS[wave - 1];
  const extraWaves = wave - ORIGINAL_WAVE_TARGETS.length;
  return Math.min(
    WAVE_SETTINGS.maxMonstersPerWave,
    ORIGINAL_WAVE_TARGETS[ORIGINAL_WAVE_TARGETS.length - 1] + extraWaves * WAVE_SETTINGS.extraMonstersPerWave
  );
}

export function isSpecialWave(wave: number): boolean {
  return wave > 0 && wave % WAVE_SETTINGS.specialWaveInterval === 0;
}

export const monsterController: GameRule = {
  init(obj: GameObject) {
    obj.parameters.currentWave = 1;
    obj.parameters.monsterOnWave = targetForWave(1);
    obj.parameters.monsterKilled = 0;
    obj.parameters.monsterSpawned = 0;
    obj.parameters.currentMonsterCooldown = 0;
    obj.parameters.specialSpawned = false;
    obj.parameters.leftOnWaveId = obj.layer.addObjectByID('leftOnWaveLabel').id;
  },
  update(obj: GameObject) {
    const createSpawn = () => {
      const rect = new Phaser.Rectangle(
        100 - obj.layer.translate.x,
        100 - obj.layer.translate.y,
        800 - obj.layer.translate.x,
        550 - obj.layer.translate.y
      );
      const position = new Phaser.Point(
        Math.min(1100, Math.max(50, rect.randomX)),
        Math.min(900, Math.max(50, rect.randomY))
      );
      // A cada quinta onda, o primeiro inimigo é um chefe e conta na meta.
      const special = isSpecialWave(obj.parameters.currentWave) && !obj.parameters.specialSpawned;
      const enemy = obj.layer.addObjectByID(special ? 'monsterBoss' : 'summonGate');
      enemy.setPosition(position);
      if (special) obj.parameters.specialSpawned = true;
    };

    const activeMonsters = obj.layer.getObjectsByType(ObjectTypes.Monster).length;
    if (obj.parameters.monsterSpawned < obj.parameters.monsterOnWave) {
      if (obj.parameters.currentMonsterCooldown > 0) {
        obj.parameters.currentMonsterCooldown--;
      } else if (activeMonsters < WAVE_SETTINGS.maxActiveMonsters) {
        createSpawn();
        obj.parameters.monsterSpawned++;
        obj.parameters.currentMonsterCooldown = WAVE_SETTINGS.spawnCooldown;
      }
    }

    if (activeMonsters === 0 && obj.parameters.monsterKilled < obj.parameters.monsterSpawned) {
      // Um monstro removido sem ser derrotado deve poder ser gerado novamente.
      // Se acabamos de gerar um objeto neste mesmo quadro, a camada já o contém.
      if (!obj.layer.getObjectsByType(ObjectTypes.Monster).length) {
        obj.parameters.monsterSpawned = obj.parameters.monsterKilled;
      }
    } else if (obj.parameters.monsterKilled >= obj.parameters.monsterOnWave) {
      obj.parameters.currentWave++;
      obj.parameters.monsterOnWave = targetForWave(obj.parameters.currentWave);
      obj.parameters.monsterSpawned = 0;
      obj.parameters.monsterKilled = 0;
      obj.parameters.currentMonsterCooldown = 0;
      obj.parameters.specialSpawned = false;
    }

    const label = obj.layer.getObjectByID(obj.parameters.leftOnWaveId);
    label.parameters.text = `WAVE ${obj.parameters.currentWave}: ${obj.parameters.monsterKilled}/${obj.parameters.monsterOnWave}`;
  },
};
