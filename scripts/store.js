/* store.js — 轻量状态管理（发布订阅） */
(function (global) {
  const state = {};
  const subs = new Map();

  function get(key) { return state[key]; }
  function set(key, value) {
    const prev = state[key];
    state[key] = value;
    if (subs.has(key)) {
      for (const cb of subs.get(key)) {
        try { cb(value, prev); } catch (e) { console.error('[store]', key, e); }
      }
    }
  }
  function subscribe(key, cb) {
    if (!subs.has(key)) subs.set(key, new Set());
    subs.get(key).add(cb);
    return () => subs.get(key).delete(cb);
  }
  function all() { return { ...state }; }
  function reset() {
    for (const k of Object.keys(state)) delete state[k];
  }

  global.store = { get, set, subscribe, all, reset };
})(window);
