# Grimsonland

Jogo 2D de sobrevivência. Projeto original: [Grimsonland](https://grimsonland.vercel.app/).

## Instalar e executar

O projeto foi iniciado com Node 14 (veja `.nvmrc`). A suíte e o build abaixo também foram executados com Node 22. Para instalar as dependências:

```bash
npm install --legacy-peer-deps
```

Em seguida, dentro da pasta do projeto:

```bash
npm test           # executa os cenários automatizados
npm run build      # verifica os tipos e gera o jogo em dist/
npm run servir     # abre um servidor local na porta 3188
```

Acesse <http://127.0.0.1:3188/>. Para parar o servidor, pressione Ctrl+C no terminal. O navegador precisa de internet para baixar Phaser e Pixi dos endereços usados no `src/index.html`.

O novo build substitui o comando Yoshi anterior, que procurava uma pasta `app` ausente. Ele primeiro verifica os tipos com `tsc --noEmit` e depois gera o jogo com webpack. As definições do Node estão fixadas na versão 14 para manter compatibilidade com o TypeScript do projeto. O comando `npm start` antigo também continua usando Yoshi; para abrir esta versão, use os comandos acima.

## Como entender os testes

Leia primeiro [tests/GUIA.md](tests/GUIA.md). Cada teste tem um nome em português e costuma seguir três passos: preparar um cenário, executar uma regra do jogo e conferir o resultado. Os arquivos estão separados por assunto:

- `tests/collisions.test.cjs`: colisões e movimentação na grade.
- `tests/ondas.test.cjs`: criação de monstros e troca de ondas.
- `tests/dano-e-feiticos.test.cjs`: dano, projétil, explosão, seleção e disparo de fireball.
- `tests/pontuacao.test.cjs`: morte de monstro, pontuação e experiência.
- `tests/recordes.test.cjs`: leitura e gravação de recordes.
- `tests/apoio.cjs`: carrega TypeScript e simula partes do Phaser para rodar sem navegador.

Os testes usam as regras do projeto, mas simulam os recursos externos necessários, como Phaser, camadas e armazenamento. Não verificam gráficos, física real, áudio, a trajetória visual dos projéteis nem todas as situações do jogo.
