/* events.js — 全局事件总线 (pub/sub) */
(function (global) {
  const handlers = new Map();

  function on(evt, cb) {
    if (!handlers.has(evt)) handlers.set(evt, new Set());
    handlers.get(evt).add(cb);
    return () => off(evt, cb);
  }
  function off(evt, cb) {
    if (handlers.has(evt)) handlers.get(evt).delete(cb);
  }
  function emit(evt, ...args) {
    if (handlers.has(evt)) {
      for (const cb of Array.from(handlers.get(evt))) {
        try { cb(...args); } catch (e) { console.error('[events]', evt, e); }
      }
    }
  }

  global.bus = { on, off, emit };
})(window);
