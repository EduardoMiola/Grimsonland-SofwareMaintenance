// Executa as regras reais do projeto, com simulações para Phaser e armazenamento.
const { total } = require('./apoio.cjs');
for (const arquivo of ['collisions', 'ondas', 'dano-e-feiticos', 'pontuacao', 'recordes']) {
  console.log(`\n${arquivo.toUpperCase()}`);
  require(`./${arquivo}.test.cjs`);
}
console.log(`\n${total()} cenários passaram.`);
