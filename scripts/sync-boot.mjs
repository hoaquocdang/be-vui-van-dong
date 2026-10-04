// Sinh lib/bootScript.ts từ scripts/boot.src.js (mã chạy độc lập với React, nhúng vào <head>).
// Chạy tự động trước `npm run dev` / `npm run build`; chạy tay: node scripts/sync-boot.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = fs.readFileSync(path.join(root, 'scripts', 'boot.src.js'), 'utf8');
if (src.includes('`') || src.includes('${')) throw new Error('boot.src.js không được chứa dấu ` hoặc ${ (vì được nhúng bằng String.raw)');
const out =
  '/* TỰ SINH từ scripts/boot.src.js bởi scripts/sync-boot.mjs — đừng sửa tay file này. */\n' +
  'export const BOOT_SCRIPT = String.raw`' + src + '`;\n';
const target = path.join(root, 'lib', 'bootScript.ts');
if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== out) {
  fs.writeFileSync(target, out);
  console.log('đã cập nhật lib/bootScript.ts');
}
