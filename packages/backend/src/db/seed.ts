import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb, runMigrations } from './connection.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface CsvRow {
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  latitude: string;
  longitude: string;
  phone: string;
  website: string;
  hours: string;
  services: string;
  image_url: string;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCsv(filePath: string): CsvRow[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim().length > 0);

  if (lines.length < 2) {
    console.log('CSV file is empty or only has headers');
    return [];
  }

  const headers = parseCsvLine(lines[0].trim());
  const rows: CsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i].trim());
    if (values.length !== headers.length) {
      console.warn(`Line ${i + 1}: expected ${headers.length} values, got ${values.length}, skipping`);
      continue;
    }

    const row: any = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx];
    });
    rows.push(row as CsvRow);
  }

  return rows;
}

function seed() {
  console.log('Initializing database...');
  runMigrations();

  const db = getDb();

  // Check if cemetery data already exists
  const count = db.prepare('SELECT COUNT(*) as count FROM cemeteries').get() as { count: number };
  if (count.count > 0) {
    console.log(`Database already has ${count.count} cemeteries. Skipping seed.`);
    return;
  }

  const csvPath = path.join(__dirname, '..', '..', '..', '..', 'data', 'cemeteries.csv');
  if (!fs.existsSync(csvPath)) {
    console.error(`Seed CSV not found at: ${csvPath}`);
    process.exit(1);
  }

  console.log(`Reading seed data from: ${csvPath}`);
  const rows = parseCsv(csvPath);
  console.log(`Found ${rows.length} cemeteries to insert`);

  const insert = db.prepare(`
    INSERT INTO cemeteries (name, description, address, city, state, zip, country, latitude, longitude, phone, website, hours, services, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((items: CsvRow[]) => {
    for (const row of items) {
      insert.run(
        row.name,
        row.description || null,
        row.address,
        row.city,
        row.state,
        row.zip || null,
        row.country || 'US',
        parseFloat(row.latitude),
        parseFloat(row.longitude),
        row.phone || null,
        row.website || null,
        row.hours || null,
        row.services || null,
        row.image_url || null
      );
    }
  });

  insertMany(rows);
  console.log(`Successfully seeded ${rows.length} cemeteries`);
}

seed();