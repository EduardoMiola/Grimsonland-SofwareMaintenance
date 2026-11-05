const assert = require('assert');
const fs = require('fs');
const path = require('path');
const Module = require('module');
const ts = require('typescript');

// The collision module has only type imports, so it can be exercised without Phaser.
const sourcePath = path.join(__dirname, '..', 'src', 'engine', 'collisions.ts');
const source = fs.readFileSync(sourcePath, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
}).outputText;
const moduleUnderTest = new Module(sourcePath, module);
moduleUnderTest.filename = sourcePath;
moduleUnderTest.paths = module.paths;
moduleUnderTest._compile(compiled, sourcePath);
const bootstrapCollisions = moduleUnderTest.exports.bootstrapCollisions;

function object(name, x, y, size = 20) {
  return { name, pos: { x, y }, size: [size, size], collisions: { cells: [], objects: [] } };
}

function names(item) {
  return item.collisions.objects.map(other => other.name).sort();
}

const grid = bootstrapCollisions({ n: 6, width: 800, height: 600 });
const a = object('a', 100, 100);
const b = object('b', 110, 100);
const c = object('c', 120, 100);
const d = object('d', 500, 400);
for (const item of [a, b, c, d]) grid.updateObject(item);
grid.check();
assert.deepStrictEqual([names(a), names(b), names(c), names(d)], [['b'], ['a', 'c'], ['b'], []]);

for (const item of [a, b, c, d]) item.collisions.objects = [];
b.pos.x = 500;
b.pos.y = 400;
grid.updateObject(b);
grid.removeObject(c);
grid.check();
assert.deepStrictEqual([names(a), names(b), names(c), names(d)], [[], ['d'], [], ['b']]);
grid.clear();
assert.strictEqual(grid.cellGrid.reduce((count, cell) => count + cell.length, 0), 0);

// A pair of equal boxes overlaps exactly when both axis distances are below the size.
let cases = 0;
for (const size of [8, 20, 64, 80]) {
  for (const dx of [-80, -64, -20, -8, 0, 8, 20, 64, 80]) {
    for (const dy of [-20, 0, 20]) {
      const pairGrid = bootstrapCollisions({ n: 6, width: 800, height: 600 });
      const first = object('first', 250, 250, size);
      const second = object('second', 250 + dx, 250 + dy, size);
      pairGrid.updateObject(first);
      pairGrid.updateObject(second);
      pairGrid.check();
      const expected = Math.abs(dx) < size && Math.abs(dy) < size;
      assert.strictEqual(first.collisions.objects.includes(second), expected, `size=${size}, dx=${dx}, dy=${dy}`);
      assert.strictEqual(second.collisions.objects.includes(first), expected, `reverse size=${size}, dx=${dx}, dy=${dy}`);
      cases++;
    }
  }
}
console.log(`Collision tests passed: movement, removal, clearing and ${cases} box combinations.`);
