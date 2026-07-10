import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const csvPath = path.join(rootDir, 'data-source', 'traits.csv');
const outputPath = path.join(rootDir, 'src', 'data', 'traits.json');

const requiredHeaders = ['id', 'name', 'category', 'categoryName', 'sort'];
const allowedCategories = new Set(['ability', 'element', 'special']);

function fail(rowNumber, fieldName, message) {
  throw new Error(`第 ${rowNumber} 列欄位 ${fieldName} 錯誤：${message}`);
}

function failGlobal(message) {
  throw new Error(`CSV 錯誤：${message}`);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  const input = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const nextChar = input[index + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (char !== '\r') {
      field += char;
    }
  }

  if (inQuotes) {
    failGlobal('CSV 引號沒有正確關閉');
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((csvRow) => csvRow.some((value) => value.trim() !== ''));
}

function rowsToObjects(rows) {
  if (rows.length < 2) {
    failGlobal('至少需要標題列與一筆屬性資料');
  }

  const headers = rows[0].map((header) => header.trim());
  const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));

  if (missingHeaders.length > 0) {
    failGlobal(`缺少欄位：${missingHeaders.join(', ')}`);
  }

  return rows.slice(1).map((row, rowIndex) => {
    const rowNumber = rowIndex + 2;

    if (row.length !== headers.length) {
      failGlobal(`第 ${rowNumber} 列欄位數量不正確，預期 ${headers.length} 欄，收到 ${row.length} 欄`);
    }

    return headers.reduce((record, header, index) => {
      record[header] = row[index].trim();
      return record;
    }, { rowNumber });
  });
}

function parseRequiredText(rowNumber, record, fieldName) {
  const value = record[fieldName];

  if (!value) {
    fail(rowNumber, fieldName, '不可空白');
  }

  return value;
}

function parseSort(rowNumber, value) {
  if (value === '' || Number.isNaN(Number(value))) {
    fail(rowNumber, 'sort', '必須是數字');
  }

  return Number(value);
}

function validateUniqueId(rowNumber, id, seenIds) {
  if (seenIds.has(id)) {
    fail(rowNumber, 'id', `CSV 裡的 id 不可重複，"${id}" 已出現在第 ${seenIds.get(id)} 列`);
  }

  seenIds.set(id, rowNumber);
}

function convertRecord(record, seenIds) {
  const rowNumber = record.rowNumber;
  const id = parseRequiredText(rowNumber, record, 'id');
  const name = parseRequiredText(rowNumber, record, 'name');
  const category = parseRequiredText(rowNumber, record, 'category');
  const categoryName = parseRequiredText(rowNumber, record, 'categoryName');
  const sort = parseSort(rowNumber, record.sort);

  validateUniqueId(rowNumber, id, seenIds);

  if (!allowedCategories.has(category)) {
    fail(rowNumber, 'category', `只能是 ability、element、special，收到 "${category}"`);
  }

  return {
    id,
    name,
    category,
    categoryName,
    sort,
  };
}

function main() {
  const csvText = fs.readFileSync(csvPath, 'utf8');
  const rows = parseCsv(csvText);
  const records = rowsToObjects(rows);
  const seenIds = new Map();
  const traits = records
    .map((record) => convertRecord(record, seenIds))
    .sort((first, second) => first.sort - second.sort);

  fs.writeFileSync(outputPath, `${JSON.stringify(traits, null, 2)}\n`, 'utf8');
  console.log(`已轉換 ${traits.length} 個屬性：${path.relative(rootDir, outputPath)}`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
