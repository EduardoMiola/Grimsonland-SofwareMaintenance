import type { GameObject } from "./object";

const DEFAULT_CELL_SHIFT = 6;
const DEFAULT_WIDTH = 800;
const DEFAULT_HEIGHT = 600;

export const bootstrapCollisions = (config: {
  n: number;
  width: number;
  height: number;
}) => {
  const n = config.n || DEFAULT_CELL_SHIFT;
  const width = config.width || DEFAULT_WIDTH;
  const height = config.height || DEFAULT_HEIGHT;
  const sizeX = width >> n;
  const sizeY = height >> n;
  const cellGrid = new Array(sizeX * sizeY);

  const generateMap = () => {
    for (let i = 0; i < cellGrid.length; i++) {
      cellGrid[i] = [];
    }
  };

  const getCell = (point: number[]) => {
    return point[0] + point[1] * sizeY;
  };

  const removeObject = (object: GameObject) => {
    const oldCells = object.collisions.cells;

    for (let i = 0; i < oldCells.length; i++) {
      cellGrid[oldCells[i]] &&
        cellGrid[oldCells[i]].splice(cellGrid[oldCells[i]].indexOf(object), 1);
    }
  };

  const getPointsOfObject = (object: GameObject) => {
    const pos = object.pos!;
    const size = object.size!;
    const cells = [];
    const xIndex = size[0] >> n;
    const yIndex = size[1] >> n;

    for (let i = 0; i < 2 + xIndex; i++) {
      for (let j = 0; j < 2 + yIndex; j++) {
        cells.push(
          getCell([
            (pos.x - size[0] / 2 + i * (size[0] / (1 + xIndex))) >> n,
            (pos.y - size[1] / 2 + j * (size[1] / (1 + yIndex))) >> n,
          ])
        );
      }
    }

    return cells;
  };

  const addToCell = (cell: number, object: GameObject) => {
    cellGrid[cell] &&
      cellGrid[cell].indexOf(object) === -1 &&
      cellGrid[cell].push(object);
  };

  const updateObject = (object: GameObject) => {
    const cells = getPointsOfObject(object);
    const oldCells = object.collisions.cells;

    for (let i = 0; i < cells.length; i++) {
      if (oldCells[i] !== cells[i]) {
        cellGrid[oldCells[i]] &&
          cellGrid[oldCells[i]].splice(
            cellGrid[oldCells[i]].indexOf(object),
            1
          );
        addToCell(cells[i], object);
        oldCells[i] = cells[i];
      } else {
        addToCell(cells[i], object);
      }
    }
  };

  const checkCollisions = () => {
    for (let i = 0; i <= sizeX; i++) {
      for (let j = 0; j <= sizeY; j++) {
        const objects = cellGrid[getCell([i, j])];
        if (!objects) continue;
        const length = objects.length;

        for (let k = 0; k < length; k++) {
          for (let l = k + 1; l < length; l++) {
            if (
              boxCollides(
                objects[k].pos,
                objects[k].size,
                objects[l].pos,
                objects[l].size
              )
            ) {
              objects[k].collisions.objects.indexOf(objects[l]) === -1 &&
                objects[k].collisions.objects.push(objects[l]);
              objects[l].collisions.objects.indexOf(objects[k]) === -1 &&
                objects[l].collisions.objects.push(objects[k]);
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
    cellGrid: cellGrid,
    updateObject: updateObject,
    removeObject: removeObject,
    check: checkCollisions,
    clear: generateMap,
  };
};
