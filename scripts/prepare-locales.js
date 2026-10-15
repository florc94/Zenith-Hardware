const fs = require('fs');
const path = require('path');

const browser = path.join(
  __dirname,
  '..',
  'dist',
  'shopsphere-angular',
  'browser'
);

const esDir = path.join(browser, 'es');
const enDir = path.join(browser, 'en');

const esIndex = path.join(esDir, 'index.html');
const enIndex = path.join(enDir, 'index.html');

if (!fs.existsSync(esIndex)) {
  console.error(
    'No se encontró el index.html español en:',
    esIndex
  );
  process.exit(1);
}

if (!fs.existsSync(enIndex)) {
  console.error(
    'No se encontró el index.html inglés en:',
    enIndex
  );
  process.exit(1);
}

/*
 * Angular genera:
 *
 * browser/
 *   es/
 *     index.html -> Español
 *
 *   en/
 *     index.html -> English
 *
 * Las dos versiones ya están generadas.
 */

let esHtml = fs.readFileSync(esIndex, 'utf8');
let enHtml = fs.readFileSync(enIndex, 'utf8');

/*
 * Español
 */
esHtml = esHtml.replace(
  /<base href="[^"]*">/,
  '<base href="/es/">'
);

/*
 * Inglés
 */
enHtml = enHtml.replace(
  /<base href="[^"]*">/,
  '<base href="/en/">'
);

fs.writeFileSync(esIndex, esHtml);
fs.writeFileSync(enIndex, enHtml);

console.log('');
console.log('Locales preparados correctamente:');
console.log('  /es/    -> Español');
console.log('  /en/    -> English');
console.log('');