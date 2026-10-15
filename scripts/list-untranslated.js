const fs = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');

const file = path.join(
  __dirname,
  '..',
  'src',
  'locale',
  'messages.en.xlf'
);

const xml = fs.readFileSync(file, 'utf8');

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_'
});

const document = parser.parse(xml);

const units = document.xliff.file.body['trans-unit'];
const list = Array.isArray(units) ? units : [units];

function text(value) {
  if (!value) return '';
  if (typeof value === 'string') return value.trim();
  if (value['#text']) return value['#text'].trim();
  return '';
}

const untranslated = list
  .map(unit => ({
    id: unit['@_id'],
    source: text(unit.source),
    target: text(unit.target)
  }))
  .filter(item =>
    item.source &&
    (!item.target || item.source === item.target)
  );

console.log('');
console.log(`🇪🇸 Textos sin traducir: ${untranslated.length}`);
console.log('');

untranslated.forEach((item, index) => {
  console.log(`${index + 1}. ${item.id}`);
  console.log(`   ${item.source}`);
  console.log('');
});
