import fs from 'node:fs';
import path from 'node:path';

const targetDir = path.resolve('gen', 'srv', 'app');
fs.mkdirSync(targetDir, { recursive: true });

const items = [
  'index.html',
  'dashboard',
  'manageractions',
  'reports',
  'assets',
  'overview',
  'employees',
  'mgremployees',
  'departments',
  'categories',
  'vendors',
  'auditlog',
  'inventory',
  'myassets',
  'myhistory',
  'myprofile',
  'myrequests'
];

for (const item of items) {
  const src = path.resolve('app', item);
  const dest = path.resolve(targetDir, item);
  if (fs.existsSync(src)) {
    fs.cpSync(src, dest, { recursive: true });
    console.log(`Copied ${item} -> gen/srv/app/${item}`);
  }
}

console.log('Fiori apps copied successfully to gen/srv/app');
