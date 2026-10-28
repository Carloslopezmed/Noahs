function xmlEscape(value: string) {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

export function makeXlsx(rows: string[][]): Uint8Array {
  const encoder = new TextEncoder();
  const columnName = (index: number) => {
    let name = '';
    for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) name = String.fromCharCode(65 + ((n - 1) % 26)) + name;
    return name;
  };
  const worksheet = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>' +
    rows.map((row, r) => '<row r="' + (r + 1) + '">' + row.map((value, c) => {
      const ref = columnName(c) + (r + 1);
      return '<c r="' + ref + '" t="inlineStr"><is><t xml:space="preserve">' + xmlEscape(String(value ?? '')) + '</t></is></c>';
    }).join('') + '</row>').join('') + '</sheetData></worksheet>';
  const files = [
    { name: '[Content_Types].xml', text: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>' },
    { name: '_rels/.rels', text: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
    { name: 'xl/workbook.xml', text: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Usuarios" sheetId="1" r:id="rId1"/></sheets></workbook>' },
    { name: 'xl/_rels/workbook.xml.rels', text: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>' },
    { name: 'xl/worksheets/sheet1.xml', text: worksheet }
  ].map(file => ({ name: file.name, nameBytes: encoder.encode(file.name), data: encoder.encode(file.text) }));

  const crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let value = n;
    for (let bit = 0; bit < 8; bit++) value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
    crcTable[n] = value >>> 0;
  }
  const crc32 = (bytes: Uint8Array) => {
    let crc = 0xffffffff;
    for (const byte of bytes) crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 0xff];
    return (crc ^ 0xffffffff) >>> 0;
  };
  const localRecords: Uint8Array[] = [];
  const centralRecords: Uint8Array[] = [];
  let localOffset = 0;
  const write16 = (view: DataView, offset: number, value: number) => view.setUint16(offset, value, true);
  const write32 = (view: DataView, offset: number, value: number) => view.setUint32(offset, value >>> 0, true);
  for (const file of files) {
    const checksum = crc32(file.data);
    const local = new Uint8Array(30 + file.nameBytes.length);
    const lv = new DataView(local.buffer);
    write32(lv, 0, 0x04034b50); write16(lv, 4, 20); write16(lv, 6, 0); write16(lv, 8, 0);
    write16(lv, 10, 0); write16(lv, 12, 0x0021); write32(lv, 14, checksum);
    write32(lv, 18, file.data.length); write32(lv, 22, file.data.length);
    write16(lv, 26, file.nameBytes.length); write16(lv, 28, 0); local.set(file.nameBytes, 30);
    localRecords.push(local, file.data);

    const central = new Uint8Array(46 + file.nameBytes.length);
    const cv = new DataView(central.buffer);
    write32(cv, 0, 0x02014b50); write16(cv, 4, 20); write16(cv, 6, 20); write16(cv, 8, 0); write16(cv, 10, 0);
    write16(cv, 12, 0); write16(cv, 14, 0x0021); write32(cv, 16, checksum);
    write32(cv, 20, file.data.length); write32(cv, 24, file.data.length);
    write16(cv, 28, file.nameBytes.length); write16(cv, 30, 0); write16(cv, 32, 0);
    write16(cv, 34, 0); write16(cv, 36, 0); write32(cv, 38, 0); write32(cv, 42, localOffset);
    central.set(file.nameBytes, 46); centralRecords.push(central);
    localOffset += local.length + file.data.length;
  }
  const centralDirectory = new Uint8Array(centralRecords.reduce((sum, part) => sum + part.length, 0));
  let centralAt = 0;
  for (const part of centralRecords) { centralDirectory.set(part, centralAt); centralAt += part.length; }
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  write32(ev, 0, 0x06054b50); write16(ev, 4, 0); write16(ev, 6, 0);
  write16(ev, 8, files.length); write16(ev, 10, files.length);
  write32(ev, 12, centralDirectory.length); write32(ev, 16, localOffset); write16(ev, 20, 0);
  const outputParts = [...localRecords, centralDirectory, end];
  const output = new Uint8Array(outputParts.reduce((sum, part) => sum + part.length, 0));
  let outputOffset = 0;
  for (const part of outputParts) { output.set(part, outputOffset); outputOffset += part.length; }
  return output;
}