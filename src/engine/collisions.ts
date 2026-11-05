import type { GameObject } from "./object";

const DEFAULT_CELL_SHIFT = 6;
const DEFAULT_WIDTH = 800;
const DEFAULT_HEIGHT = 600;

export const bootstrapCollisions = (config: {
  n: number;
  width: number;
  height: number;
}) => {
  // Each cell spans 2 ** cellShift pixels along each axis.
  const cellShift = config.n || DEFAULT_CELL_SHIFT;
  const width = config.width || DEFAULT_WIDTH;
  const height = config.height || DEFAULT_HEIGHT;
  const columns = width >> cellShift;
  const rows = height >> cellShift;
  const cellGrid: GameObject[][] = new Array(columns * rows);

  const generateMap = () => {
    for (let i = 0; i < cellGrid.length; i++) {
      cellGrid[i] = [];
    }
  };

  const getCellIndex = (x: number, y: number) => x + y * rows;

  const removeFromCell = (cellIndex: number, object: GameObject) => {
    const cell = cellGrid[cellIndex];
    if (cell) {
      cell.splice(cell.indexOf(object), 1);
    }
  };

  const removeObject = (object: GameObject) => {
    const oldCells = object.collisions.cells;

    for (let i = 0; i < oldCells.length; i++) {
      removeFromCell(oldCells[i], object);
    }
  };

  const getObjectCells = (object: GameObject) => {
    const position = object.pos!;
    const [objectWidth, objectHeight] = object.size!;
    const cells: number[] = [];
    const horizontalSteps = objectWidth >> cellShift;
    const verticalSteps = objectHeight >> cellShift;

    for (let xStep = 0; xStep < 2 + horizontalSteps; xStep++) {
      for (let yStep = 0; yStep < 2 + verticalSteps; yStep++) {
        const x =
          (position.x - objectWidth / 2 + xStep * (objectWidth / (1 + horizontalSteps))) >>
          cellShift;
        const y =
          (position.y - objectHeight / 2 + yStep * (objectHeight / (1 + verticalSteps))) >>
          cellShift;
        cells.push(getCellIndex(x, y));
      }
    }

    return cells;
  };

  const addToCell = (cellIndex: number, object: GameObject) => {
    const cell = cellGrid[cellIndex];
    if (cell && cell.indexOf(object) === -1) {
      cell.push(object);
    }
  };

  const updateObject = (object: GameObject) => {
    const cells = getObjectCells(object);
    const oldCells = object.collisions.cells;

    for (let i = 0; i < cells.length; i++) {
      if (oldCells[i] !== cells[i]) {
        removeFromCell(oldCells[i], object);
        oldCells[i] = cells[i];
      }
      addToCell(cells[i], object);
    }
  };

  const checkCollisions = () => {
    for (let x = 0; x <= columns; x++) {
      for (let y = 0; y <= rows; y++) {
        const objects = cellGrid[getCellIndex(x, y)];
        if (!objects) continue;
        const length = objects.length;

        for (let k = 0; k < length; k++) {
          for (let l = k + 1; l < length; l++) {
            const first = objects[k];
            const second = objects[l];
            if (boxCollides(first.pos, first.size!, second.pos, second.size!)) {
              if (first.collisions.objects.indexOf(second) === -1) {
                first.collisions.objects.push(second);
              }
              if (second.collisions.objects.indexOf(first) === -1) {
                second.collisions.objects.push(first);
              }
            }
          }
        }
      }
    }
  };

  type Rectangle = { x: number; y: number; width: number; height: number };
  const collides = (first: Rectangle, second: Rectangle) =>
    first.x < second.x + second.width &&
    first.x + first.width > second.x &&
    first.y < second.y + second.height &&
    first.y + first.height > second.y;

  const boxCollides = (
    pos: Phaser.Point,
    size: number[],
    pos2: Phaser.Point,
    size2: number[]
  ) =>
    collides(
      {
        x: pos.x - size[0] / 2,
        y: pos.y - size[1] / 2,
        width: size[0],
        height: size[1],
      },
      {
        x: pos2.x - size2[0] / 2,
        y: pos2.y - size2[1] / 2,
        width: size2[0],
        height: size2[1],
      }
    );

  generateMap();

  return {
    cellGrid,
    updateObject,
    removeObject,
    check: checkCollisions,
    clear: generateMap,
  };
};
