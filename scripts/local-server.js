const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const root = path.join(
  __dirname,
  '..',
  'dist',
  'shopsphere-angular',
  'browser'
);

const port = 4200;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

function sendFile(res, filePath) {
  if (!fs.existsSync(filePath)) {
    res.writeHead(404, {
      'Content-Type': 'text/plain; charset=utf-8'
    });

    res.end('404 - Not Found');
    return;
  }

  const ext = path.extname(filePath);

  const contentType =
    mimeTypes[ext] || 'application/octet-stream';

  res.writeHead(200, {
    'Content-Type': contentType
  });

  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(
    url.parse(req.url).pathname
  );

  /*
   * =====================================================
   * ENGLISH
   * =====================================================
   */

  if (pathname === '/en' || pathname.startsWith('/en/')) {
    const relativePath = pathname
      .replace(/^\/en\/?/, '');

    /*
     * Solo intentamos servir archivos físicos.
     *
     * Ejemplo:
     * /en/assets/logo.svg
     *
     * Las rutas Angular como:
     * /en/
     * /en/catalog
     * /en/catalog/1
     * /en/cart
     * /en/orders
     * /en/admin
     *
     * NO son archivos físicos.
     */

    if (relativePath) {
      const filePath = path.join(
        root,
        'en',
        relativePath
      );

      if (
        fs.existsSync(filePath) &&
        fs.statSync(filePath).isFile()
      ) {
        sendFile(res, filePath);
        return;
      }
    }

    /*
     * SPA FALLBACK INGLÉS
     *
     * Cualquier ruta Angular /en/... carga
     * el index.html inglés.
     */

    sendFile(
      res,
      path.join(root, 'en', 'index.html')
    );

    return;
  }

  /*
   * =====================================================
   * SPANISH
   * =====================================================
   */

  const relativePath = pathname.replace(/^\/+/, '');

  const filePath = pathname === '/'
    ? path.join(root, 'index.html')
    : path.join(root, relativePath);

  /*
   * Archivo físico
   */

  if (
    fs.existsSync(filePath) &&
    fs.statSync(filePath).isFile()
  ) {
    sendFile(res, filePath);
    return;
  }

  /*
   * SPA FALLBACK ESPAÑOL
   */

  sendFile(
    res,
    path.join(root, 'index.html')
  );
});

server.listen(port, () => {
  console.log('');
  console.log('ShopSphere disponible en:');
  console.log(`  http://localhost:${port}/`);
  console.log(`  http://localhost:${port}/en/`);
  console.log('');
});