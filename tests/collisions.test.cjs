const assert = require('assert');
const { teste } = require('./apoio.cjs');
const { bootstrapCollisions } = require('../src/engine/collisions.ts');

// Criamos apenas os dados que o detector de colisões usa. Não são desenhos na tela.
function objeto(nome, x, y, tamanho = 20) {
  return {
    nome,
    pos: { x, y },
    size: [tamanho, tamanho],
    collisions: { cells: [], objects: [] },
  };
}
function criarGrade() {
  return bootstrapCollisions({ n: 6, width: 800, height: 600 });
}
function nomesEmContato(item) {
  return item.collisions.objects.map(outro => outro.nome).sort();
}

teste('objetos sobrepostos entram na lista um do outro; bordas apenas encostadas não', () => {
  // Preparar: A cruza B; B cruza C; A e C só encostam pelas bordas.
  const grade = criarGrade();
  const a = objeto('A', 100, 100);
  const b = objeto('B', 110, 100);
  const c = objeto('C', 120, 100);
  const distante = objeto('distante', 500, 400);
  for (const item of [a, b, c, distante]) grade.updateObject(item);

  // Agir: pedir ao jogo que identifique os contatos.
  grade.check();

  // Conferir: o contato deve aparecer dos dois lados e sem incluir o distante.
  assert.deepStrictEqual(nomesEmContato(a), ['B']);
  assert.deepStrictEqual(nomesEmContato(b), ['A', 'C']);
  assert.deepStrictEqual(nomesEmContato(c), ['B']);
  assert.deepStrictEqual(nomesEmContato(distante), []);
});

teste('ao mover e remover objetos, a grade usa suas novas posições', () => {
  // Preparar: A e B começam próximos; C fica distante.
  const grade = criarGrade();
  const a = objeto('A', 100, 100);
  const b = objeto('B', 110, 100);
  const c = objeto('C', 500, 400);
  for (const item of [a, b, c]) grade.updateObject(item);

  // Agir: mover B para cima de C e retirar A da grade.
  b.pos = { x: 500, y: 400 };
  grade.updateObject(b);
  grade.removeObject(a);
  grade.check();

  // Conferir: somente B e C devem colidir.
  assert.deepStrictEqual(nomesEmContato(a), []);
  assert.deepStrictEqual(nomesEmContato(b), ['C']);
  assert.deepStrictEqual(nomesEmContato(c), ['B']);
});

teste('limpar a grade remove todos os objetos das células', () => {
  const grade = criarGrade();
  grade.updateObject(objeto('A', 100, 100));
  grade.clear();
  assert.strictEqual(grade.cellGrid.reduce((total, celula) => total + celula.length, 0), 0);
});

teste('colisão retangular funciona em 108 combinações de distância e tamanho', () => {
  // Para quadrados iguais, há sobreposição somente se a distância em X e em Y
  // for menor que o lado. A igualdade significa bordas encostadas, sem colisão.
  let combinacoes = 0;
  for (const tamanho of [8, 20, 64, 80]) {
    for (const distanciaX of [-80, -64, -20, -8, 0, 8, 20, 64, 80]) {
      for (const distanciaY of [-20, 0, 20]) {
        const grade = criarGrade();
        const primeiro = objeto('primeiro', 250, 250, tamanho);
        const segundo = objeto('segundo', 250 + distanciaX, 250 + distanciaY, tamanho);
        grade.updateObject(primeiro);
        grade.updateObject(segundo);
        grade.check();

        const deveColidir = Math.abs(distanciaX) < tamanho && Math.abs(distanciaY) < tamanho;
        const caso = `tamanho=${tamanho}, x=${distanciaX}, y=${distanciaY}`;
        assert.strictEqual(primeiro.collisions.objects.includes(segundo), deveColidir, caso);
        assert.strictEqual(segundo.collisions.objects.includes(primeiro), deveColidir, caso);
        combinacoes++;
      }
    }
  }
  assert.strictEqual(combinacoes, 108);
});
