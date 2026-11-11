/* Exits 0 if the database answers, 1 otherwise. Used by START_FAB_WINES.bat */
const fs = require('fs'), path = require('path');
try { fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split(/\r?\n/).forEach(l => { const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/); if (m && !l.trim().startsWith('#') && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, ''); }); } catch (e) {}
const { Pool } = require('pg');
const p = new Pool({ connectionString: (process.env.DATABASE_URL || '').replace(/[?&]channel_binding=[^&]*/, ''), connectionTimeoutMillis: 8000 });
p.query('SELECT 1').then(() => process.exit(0)).catch(() => process.exit(1));
