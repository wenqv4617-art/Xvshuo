/* utils/clone.js — 深拷贝 */
window.deepClone = function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (typeof structuredClone === 'function') {
    try { return structuredClone(obj); } catch {}
  }
  // Fallback
  return JSON.parse(JSON.stringify(obj));
};
