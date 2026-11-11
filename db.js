'use strict';
/* Postgres (Neon) storage for Fab Wines.
   Each collection is a table with an id, an insertion sequence and a jsonb document, and this file offers the small
   set of find/insert/update calls the server uses, so every route keeps its exact behaviour. Updates lock the row
   they change, so stock is taken atomically and can never be oversold. */
const crypto = require('crypto');
const { Pool } = require('pg');

const NAMES = ['users', 'products', 'orders', 'wishlist', 'coupons', 'notifications', 'enquiries', 'subscribers', 'reviews', 'meta'];
let pool;
const newId = () => crypto.randomBytes(12).toString('hex');
const isOp = v => v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).some(k => k[0] === '$');

function where(filter, params) {
  const parts = [];
  Object.keys(filter || {}).forEach(k => {
    const v = filter[k];
    if (k === '_id') { params.push(String(v)); parts.push('id = $' + params.length); return; }
    const f = "doc->'" + k.replace(/[^a-z_0-9]/gi, '') + "'";
    if (isOp(v)) {
      Object.keys(v).forEach(op => {
        params.push(op === '$ne' ? JSON.stringify(v[op]) : v[op]);
        const n = '$' + params.length;
        if (op === '$ne') parts.push(f + ' IS DISTINCT FROM ' + n + '::jsonb');
        else if (op === '$gte') parts.push('(' + f.replace("doc->'", "doc->>'") + ')::numeric >= ' + n);
        else if (op === '$lte') parts.push('(' + f.replace("doc->'", "doc->>'") + ')::numeric <= ' + n);
        else throw new Error('Unsupported filter ' + op);
      });
    } else { params.push(JSON.stringify(v === undefined ? null : v)); parts.push(f + ' = $' + params.length + '::jsonb'); }
  });
  return parts.length ? parts.join(' AND ') : 'TRUE';
}
function order(sort) {
  const o = Object.keys(sort || {}).map(k => (k === '_id' ? 'seq' : "doc->'" + k.replace(/[^a-z_0-9]/gi, '') + "'") + (sort[k] < 0 ? ' DESC' : ' ASC'));
  return ' ORDER BY ' + o.concat(['seq ASC']).join(', ');
}
const out = r => { const d = r.doc; d._id = r.id; return d; };
const apply = (d, u) => {
  Object.assign(d, u.$set || {});
  Object.keys(u.$inc || {}).forEach(k => { d[k] = (+d[k] || 0) + u.$inc[k]; });
  Object.keys(u.$push || {}).forEach(k => { (d[k] = d[k] || []).push(u.$push[k]); });
  return d;
};
async function tx(fn) {
  const c = await pool.connect();
  try { await c.query('BEGIN'); const r = await fn(c); await c.query('COMMIT'); return r; }
  catch (e) { try { await c.query('ROLLBACK'); } catch (x) {} if (e.code === '23505') e.code = 11000; throw e; }
  finally { c.release(); }
}

function collection(name) {
  const t = 'c_' + name;
  const q = (sql, params) => pool.query(sql, params).catch(e => { if (e.code === '23505') e.code = 11000; throw e; });
  const cursor = (filter) => {
    const st = { sort: null, lim: 0 };
    const c = {
      sort(s) { st.sort = s; return c; }, limit(n) { st.lim = n; return c; }, project() { return c; },
      async toArray() { const p = []; const w = where(filter, p); return (await q('SELECT id, doc FROM ' + t + ' WHERE ' + w + order(st.sort) + (st.lim ? ' LIMIT ' + (+st.lim | 0) : ''), p)).rows.map(out); }
    };
    return c;
  };
  return {
    find: cursor,
    async findOne(filter) { const p = []; const w = where(filter, p); const r = await q('SELECT id, doc FROM ' + t + ' WHERE ' + w + ' ORDER BY seq LIMIT 1', p); return r.rows[0] ? out(r.rows[0]) : null; },
    async countDocuments(filter) { const p = []; const w = where(filter, p); return +(await q('SELECT count(*) AS n FROM ' + t + ' WHERE ' + w, p)).rows[0].n; },
    async insertOne(doc) { const { _id, ...rest } = doc; const id = _id != null ? String(_id) : newId(); await q('INSERT INTO ' + t + ' (id, doc) VALUES ($1, $2)', [id, rest]); return { insertedId: id }; },
    async insertMany(docs) { for (const d of docs) await this.insertOne(d); return { insertedCount: docs.length }; },
    async updateOne(filter, u, opt) {
      return tx(async c => {
        const p = []; const w = where(filter, p);
        const r = await c.query('SELECT id, doc FROM ' + t + ' WHERE ' + w + ' ORDER BY seq LIMIT 1 FOR UPDATE', p);
        if (r.rows[0]) { await c.query('UPDATE ' + t + ' SET doc = $2 WHERE id = $1', [r.rows[0].id, apply(r.rows[0].doc, u)]); return { matchedCount: 1 }; }
        if (opt && opt.upsert) {
          const base = {}; Object.keys(filter).forEach(k => { if (k !== '_id' && !isOp(filter[k])) base[k] = filter[k]; });
          const d = apply(Object.assign(base, u.$setOnInsert || {}), u);
          await c.query('INSERT INTO ' + t + ' (id, doc) VALUES ($1, $2)', [filter._id != null ? String(filter._id) : newId(), d]); return { matchedCount: 0, upsertedCount: 1 };
        }
        return { matchedCount: 0 };
      });
    },
    async updateMany(filter, u) {
      return tx(async c => {
        const p = []; const w = where(filter, p); const r = await c.query('SELECT id, doc FROM ' + t + ' WHERE ' + w + ' FOR UPDATE', p);
        for (const row of r.rows) await c.query('UPDATE ' + t + ' SET doc = $2 WHERE id = $1', [row.id, apply(row.doc, u)]);
        return { matchedCount: r.rows.length };
      });
    },
    async deleteOne(filter) { const p = []; const w = where(filter, p); await q('DELETE FROM ' + t + ' WHERE id IN (SELECT id FROM ' + t + ' WHERE ' + w + ' LIMIT 1)', p); },
    async deleteMany(filter) { const p = []; const w = where(filter, p); await q('DELETE FROM ' + t + ' WHERE ' + w, p); },
    async createIndex(keys, opt) {
      const fields = Object.keys(keys).map(k => k === '_id' ? 'id' : "(doc->>'" + k.replace(/[^a-z_0-9]/gi, '') + "')");
      await q('CREATE ' + (opt && opt.unique ? 'UNIQUE ' : '') + 'INDEX IF NOT EXISTS ' + t + '_' + Object.keys(keys).join('_') + ' ON ' + t + ' (' + fields.join(', ') + ')');
    }
  };
}

async function connect(url) {
  pool = new Pool({ connectionString: url.replace(/[?&]channel_binding=[^&]*/, ''), max: process.env.VERCEL ? 3 : 8, connectionTimeoutMillis: 10000, idleTimeoutMillis: 20000 });
  pool.on('error', () => {});
  await pool.query('SELECT 1');
  for (const n of NAMES) await pool.query('CREATE TABLE IF NOT EXISTS c_' + n + ' (id text PRIMARY KEY, seq bigserial, doc jsonb NOT NULL)');
  const C = {}; NAMES.forEach(n => { C[n] = collection(n); });
  return { C, ping: () => pool.query('SELECT 1'), close: () => pool.end() };
}
module.exports = { connect };
