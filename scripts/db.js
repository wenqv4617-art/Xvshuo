/* db.js — Dexie 数据层
 * 9+2 表（追加 sideStories 番外 / htmlSnippets HTML）
 */
(function (global) {
  if (!global.Dexie) {
    console.error('[db] Dexie not loaded');
    global.xvdb = null;
    return;
  }
  const db = new Dexie('xvshuo-db');

  // Schema v2 — 加入番外 / HTML 表
  db.version(2).stores({
    settings: 'id',
    apiPresets: 'id, name, protocol, isDefault, createdAt',
    userPersonas: 'id, name, groupId, boundCharId, createdAt, updatedAt',
    charPersonas: 'id, name, groupId, createdAt, updatedAt',
    worldbooks: 'id, name, createdAt, updatedAt',
    styles: 'id, name, createdAt, updatedAt',
    regexRules: 'id, name, createdAt, updatedAt',
    groups: 'id, name, type, createdAt',
    customTags: 'id, [category+gender], value, category',
    // M1 追加
    sideStories: 'id, name, boundCharId, boundUserId, createdAt, updatedAt',  // 番外
    htmlSnippets: 'id, name, kind, createdAt, updatedAt'                       // HTML 产物
  });

  // 通用 CRUD
  async function put(table, item) { return db[table].put(item); }
  async function get(table, id) { return db[table].get(id); }
  async function all(table) { return db[table].toArray(); }
  async function whereEq(table, field, value) { return db[table].where(field).equals(value).toArray(); }
  async function del(table, id) { return db[table].delete(id); }
  async function delWhere(table, field, value) { return db[table].where(field).equals(value).delete(); }
  async function delWhereFn(table, fn) {
    const rows = await db[table].toArray();
    const ids = rows.filter(fn).map((r) => r.id).filter(Boolean);
    if (ids.length) return db[table].bulkDelete(ids);
  }
  async function clearTable(table) { return db[table].clear(); }
  async function putAll(table, items) { return db[table].bulkPut(items); }

  // 全表导出 / 导入
  const TABLES = ['settings', 'apiPresets', 'userPersonas', 'charPersonas', 'worldbooks', 'styles', 'regexRules', 'groups', 'customTags', 'sideStories', 'htmlSnippets'];

  async function exportAll() {
    const result = { _schema: 2, _exportedAt: new Date().toISOString(), _appVersion: global.APP_VERSION, data: {} };
    for (const t of TABLES) result.data[t] = await db[t].toArray();
    return result;
  }
  async function importAll(json) {
    if (!json || !json.data) throw new Error('invalid backup file');
    for (const [t, rows] of Object.entries(json.data)) {
      if (db[t] && Array.isArray(rows)) await db[t].bulkPut(rows);
    }
    return Object.keys(json.data).length;
  }

  // 默认设置初始化
  async function ensureDefaults() {
    const s = await db.settings.get('global');
    if (!s) {
      await db.settings.put({
        id: 'global',
        activePresetId: null,
        responseProtocol: 'json',  // 'json' | 'text'
        theme: 'editorial',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  }

  db.open().then(ensureDefaults).catch((e) => console.error('[db] open failed:', e));

  global.xvdb = {
    instance: db,
    put, get, all, whereEq, del, delWhere, delWhereFn, clearTable, putAll,
    exportAll, importAll, ensureDefaults,
    TABLES
  };
})(window);
