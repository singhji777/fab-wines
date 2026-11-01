/* Exits 0 if MongoDB answers, 1 otherwise. Used by START_FAB_WINES.bat */
const fs = require('fs'), path = require('path');
try { fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split(/\r?\n/).forEach(l => { const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/); if (m && !l.trim().startsWith('#') && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, ''); }); } catch (e) {}
const { MongoClient } = require('mongodb');
const c = new MongoClient(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017', { serverSelectionTimeoutMS: 4000 });
c.connect().then(() => c.db('admin').command({ ping: 1 })).then(() => { console.log('MongoDB is running.'); return c.close(); }).then(() => process.exit(0)).catch(() => process.exit(1));
