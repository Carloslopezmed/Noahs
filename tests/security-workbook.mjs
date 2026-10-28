import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';

mkdirSync('.sites-runtime/tests', { recursive: true });
for (const name of ['catalog', 'service', 'xlsx']) {
  const source = readFileSync(`lib/noahs/${name}.ts`, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText.replace("from './catalog'", "from './catalog.mjs'");
  writeFileSync(`.sites-runtime/tests/${name}.mjs`, compiled);
}

const { createService } = await import('../.sites-runtime/tests/service.mjs');
const { makeXlsx } = await import('../.sites-runtime/tests/xlsx.mjs');
const sqlite = new DatabaseSync(':memory:');
for (const file of readdirSync('drizzle').filter((name) => name.endsWith('.sql')).sort()) {
  sqlite.exec(readFileSync('drizzle/' + file, 'utf8'));
}
function statement(sql) {
  let args = [];
  const statementApi = {
    bind(...values) { args = values; return statementApi; },
    async first() { return sqlite.prepare(sql).get(...args) || null; },
    async all() { return { results: sqlite.prepare(sql).all(...args) }; },
    async run() {
      const result = sqlite.prepare(sql).run(...args);
      return { meta: { changes: Number(result.changes) } };
    },
  };
  return statementApi;
}
const db = {
  prepare: statement,
  async batch(statements) {
    sqlite.exec('BEGIN');
    try {
      const results = [];
      for (const statementApi of statements) results.push(await statementApi.run());
      sqlite.exec('COMMIT');
      return results;
    } catch (error) {
      sqlite.exec('ROLLBACK');
      throw error;
    }
  },
};
const bootstrapSecret = 'noahs-ci-bootstrap-secret';
const app = createService(db, bootstrapSecret);
let assertions = 0;
const check = (actual, expected) => { assert.deepEqual(actual, expected); assertions++; };
async function call(body, cookie = '', identity = null) {
  return app.dispatch(
    new Request('https://noahs.test/api/noahs', { method: 'POST', headers: { cookie } }),
    body,
    identity,
  );
}
async function denied(body, cookie, expectedStatus) {
  await assert.rejects(
    () => call(body, cookie),
    (error) => !expectedStatus || error.status === expectedStatus,
  );
  assertions++;
}

// XLSX: verify ZIP structure, required OOXML parts, text escaping, and formula-safe inline strings.
const workbook = makeXlsx([
  ['Nombre', 'Usuario', 'Rol', 'Agencia', 'Estado'],
  ['José & Ana', 'user<1>', 'Maestro', 'Plaza Balcones', 'Activo'],
  ['Texto', '=1+1', 'Caja', 'Peronia', 'Activo'],
  ['Control\\u0001', 'usuario', 'Caja', 'Peronia', 'Activo'],
]);
const bytes = workbook;
const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
check(view.getUint32(0, true), 0x04034b50);
const eocdOffset = bytes.length - 22;
const eocd = new DataView(bytes.buffer, bytes.byteOffset + eocdOffset, 22);
check(eocd.getUint32(0, true), 0x06054b50);
const entryCount = eocd.getUint16(10, true);
check(entryCount, 5);
let centralOffset = eocd.getUint32(16, true);
const files = {};
const decoder = new TextDecoder();
function crc32(input) {
  let crc = 0xffffffff;
  for (const byte of input) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc & 1) ? (0xedb88320 ^ (crc >>> 1)) : (crc >>> 1);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
for (let index = 0; index < entryCount; index++) {
  const central = new DataView(bytes.buffer, bytes.byteOffset + centralOffset);
  check(central.getUint32(0, true), 0x02014b50);
  const nameLength = central.getUint16(28, true);
  const extraLength = central.getUint16(30, true);
  const commentLength = central.getUint16(32, true);
  const filename = decoder.decode(bytes.subarray(centralOffset + 46, centralOffset + 46 + nameLength));
  const localOffset = central.getUint32(42, true);
  const dataLength = central.getUint32(24, true);
  const checksum = central.getUint32(16, true);
  const local = new DataView(bytes.buffer, bytes.byteOffset + localOffset);
  check(local.getUint32(0, true), 0x04034b50);
  const localNameLength = local.getUint16(26, true);
  const localExtraLength = local.getUint16(28, true);
  const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
  const data = bytes.subarray(dataOffset, dataOffset + dataLength);
  check(crc32(data), checksum);
  files[filename] = decoder.decode(data);
  centralOffset += 46 + nameLength + extraLength + commentLength;
}
check(Object.keys(files).sort(), [
  '[Content_Types].xml',
  '_rels/.rels',
  'xl/_rels/workbook.xml.rels',
  'xl/workbook.xml',
  'xl/worksheets/sheet1.xml',
].sort());
const sheet = files['xl/worksheets/sheet1.xml'];
check(sheet.includes('José &amp; Ana'), true);
check(sheet.includes('user&lt;1&gt;'), true);
check(sheet.includes('=1+1'), true);
check(sheet.includes('<c r="B3" t="inlineStr">'), true);
check(sheet.includes('Control'), true);
check(sheet.includes('Control\\u0001'), false);

// The UI export must not select or serialize credential material.
const page = readFileSync('app/operaciones/page.tsx', 'utf8');
const exportStart = page.indexOf('function exportStaffExcel()');
const exportEnd = page.indexOf('async function resetStaffPin', exportStart);
assert.ok(exportStart >= 0 && exportEnd > exportStart);
const exportSource = page.slice(exportStart, exportEnd);
assert.ok(exportSource.includes('Nombre'));
assert.ok(exportSource.includes('Usuario'));
assert.ok(exportSource.includes('Rol'));
assert.ok(exportSource.includes('Agencia'));
assert.ok(exportSource.includes('Estado'));
assert.ok(!/pinHash|password|salt|\\.hash|\\.pin\\b/i.test(exportSource));
assertions += 6;

// Set up a temporary master account using a test-only bootstrap secret.
await denied({
  action: 'bootstrap', bootstrapSecret: 'incorrect-secret',
  name: 'Master Test', username: 'owner', pin: '12345678',
}, '', 401);
const owner = await call({
  action: 'bootstrap', bootstrapSecret,
  name: 'Master Test', username: 'owner', pin: '12345678',
}, '', 'fixture-master');
const master = owner.cookie;
check(owner.user.role, 'master');
await denied({
  action: 'bootstrap', bootstrapSecret,
  name: 'Second Master', username: 'other', pin: '12345678',
}, '', 409);

for (const [username, role, agency] of [
  ['manager', 'manager', 'peronia'],
  ['cashier', 'cashier', 'peronia'],
  ['outsider', 'driver', 'satelite'],
]) {
  await call({ action: 'saveUser', name: username, username, role, agency, pin: '12345678' }, master);
}
const staff = sqlite.prepare('SELECT * FROM staff').all();
const id = (username) => staff.find((row) => row.username === username).id;
const cookies = {};
for (const username of ['manager', 'cashier', 'outsider']) {
  cookies[username] = (await call({ action: 'login', username, pin: '12345678' })).cookie;
}
const before = sqlite.prepare('SELECT hash, salt, version FROM staff WHERE id=?').get(id('cashier'));
await denied({ action: 'resetUserPin', id: id('outsider') }, cookies.manager, 403);
await denied({ action: 'resetUserPin', id: id('cashier') }, cookies.cashier, 403);
const reset = await call({ action: 'resetUserPin', id: id('cashier') }, master);
check(reset.ok, true);
check(reset.username, 'cashier');
check(/^\\d{8}$/.test(reset.pin), true);
const after = sqlite.prepare('SELECT hash, salt, version FROM staff WHERE id=?').get(id('cashier'));
check(after.salt !== before.salt, true);
check(after.version, before.version + 1);
check(after.hash !== reset.pin, true);
await denied({ action: 'me' }, cookies.cashier, 401);
cookies.cashier = (await call({ action: 'login', username: 'cashier', pin: reset.pin })).cookie;
check(!!cookies.cashier, true);
await denied({ action: 'login', username: 'cashier', pin: '12345678' }, '', 401);
check(sqlite.prepare("SELECT COUNT(*) AS n FROM events WHERE action='reset-user-pin'").get().n, 1);
await denied({ action: 'resetUserPin', id: id('owner') }, cookies.manager, 403);
await denied({ action: 'resetUserPin', id: id('owner') }, master, 400);
console.log(`PASS: ${assertions} assertions for XLSX and secure PIN reset.`);
