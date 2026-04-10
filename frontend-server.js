const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = 8080;
const MIME = {
  html: 'text/html',
  css:  'text/css',
  js:   'application/javascript',
  json: 'application/json',
  png:  'image/png',
  jpg:  'image/jpeg',
  svg:  'image/svg+xml',
  ico:  'image/x-icon',
};

const server = http.createServer((req, res) => {
  const url  = req.url === '/' ? '/index.html' : req.url;
  const file = path.join(__dirname, url);
  const ext  = path.extname(file).slice(1);

  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
    } else {
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
      res.end(data);
    }
  });
});

function startServer(port) {
  server.listen(port, () => {
    console.log(`\x1b[32m✔ Frontend corriendo en http://localhost:${port}\x1b[0m`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`[!] Puerto ${port} ocupado, intentando con ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error(err);
    }
  });
}

startServer(PORT);
