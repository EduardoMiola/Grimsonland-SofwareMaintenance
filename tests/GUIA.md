# Entendendo os testes do Grimsonland

## Para que servem

Cada teste executa uma parte real do código do jogo com valores conhecidos e verifica o resultado. Se uma alteração fizer o resultado mudar, o comando avisa qual cenário falhou. Isso ajuda a perceber problemas, mas não garante que todo o jogo está correto.

## Como executar

No terminal, na pasta do projeto, instale as dependências com `npm install --legacy-peer-deps` e execute:

```bash
npm test
```

Cada linha com ✓ descreve um cenário que passou. Se um teste falhar, o terminal mostra o nome, o valor obtido e o valor esperado. O processo termina com erro. O arquivo `executar.cjs` escolhe os arquivos de testes e conta os cenários que passaram.

## Um exemplo concreto: dano

No arquivo `dano-e-feiticos.test.cjs`, o primeiro teste faz o seguinte:

1. **Preparar:** cria um jogador com 50 de vida e um ataque de força 12. A lista `collisions.objects` informa que o ataque encostou no jogador.
2. **Agir:** chama `damageOnPlayerCollision.update(ataque)`, a mesma regra usada pelo jogo.
3. **Conferir:** `assert.strictEqual(jogador.parameters.health, 38)` verifica se a vida passou a ser 38, porque 50 − 12 = 38. Se for diferente, o teste falha.

`assert.strictEqual(real, esperado)` compara dois valores. `assert.deepStrictEqual(real, esperado)` compara o conteúdo de listas ou objetos. Os comentários ao lado dos testes explicam as outras preparações e resultados.

## Por que há objetos simulados?

O Phaser cuida de tela, posições, teclado e outros serviços. Para conferir uma regra sem abrir o jogo, o teste cria versões pequenas desses objetos com apenas os campos e funções necessários. Por exemplo, o teclado simulado responde que uma tecla está pressionada; o `localStorage` simulado guarda os recordes em memória, sem alterar os recordes do navegador.

O arquivo `apoio.cjs` permite carregar os arquivos TypeScript e fornece versões simplificadas de `Point`, `Rectangle` e `State`. No teste de fireball, a rotação e o ângulo são simulados: ele verifica quantidade, força e intervalo dos disparos, **não a trajetória na tela**. Nos testes de ondas, a posição do portal é fixa; a aleatoriedade visual não é verificada. São simulações locais aos testes, não alterações no funcionamento do Phaser no jogo.

## O que cada grupo confere

- **Colisões:** sobreposição, bordas apenas encostadas, movimento, remoção e limpeza. Um dos cenários compara 108 combinações de tamanhos e distâncias; isso não significa 108 testes independentes de todo o jogo.
- **Ondas:** estado inicial, intervalo de criação, transição da onda 1 para a 2, condição para não avançar e reposição quando monstros desaparecem.
- **Dano e feitiços:** dano ao jogador e ao monstro, remoção de projétil, explosão, teclas de seleção e quantidade/força/intervalo da fireball.
- **Pontuação:** morte de um monstro aumenta contadores e experiência; um monstro vivo não deve aumentá-los.
- **Recordes:** leitura, valores ausentes ou inválidos, atualização quando há novo recorde e preservação quando não há melhora.

As regras de outros feitiços, ondas posteriores, movimentação real, imagens, áudio e armazenamento real do navegador não estão cobertos integralmente. Testar manualmente no navegador continua necessário.
