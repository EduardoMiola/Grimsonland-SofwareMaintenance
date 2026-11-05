const http = require('http');
const fs = require('fs');
const path = require('path');
const pasta = path.resolve(__dirname, '../dist');
const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.jpeg': 'image/jpeg', '.mp3': 'audio/mpeg' };

http.createServer((requisicao, resposta) => {
  const endereco = new URL(requisicao.url, 'http://localhost');
  // Os caminhos dos recursos originais começam com ../assets/ e são resolvidos
  // pelo navegador como /assets/ quando o jogo é aberto na raiz do servidor.
  const arquivo = path.resolve(pasta, '.' + (endereco.pathname === '/' ? '/index.html' : endereco.pathname));
  if (!arquivo.startsWith(pasta + path.sep)) return resposta.writeHead(403).end();
  fs.readFile(arquivo, (erro, conteudo) => {
    if (erro) return resposta.writeHead(404).end('Arquivo não encontrado. Execute npm run build.');
    resposta.writeHead(200, { 'Content-Type': tipos[path.extname(arquivo)] || 'application/octet-stream' });
    resposta.end(conteudo);
  });
}).listen(3188, '127.0.0.1', () => console.log('Abra http://127.0.0.1:3188/ — Ctrl+C para encerrar.'));
