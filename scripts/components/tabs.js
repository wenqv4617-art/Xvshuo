/* components/tabs.js — Tab 切换 */
(function (global) {
  const { el } = global.dom;

  /**
   * @param {Array<{key:string, label:string}>} tabs
   * @param {string} active
   * @param {(key:string)=>void} onChange
   */
  function make(tabs, active, onChange) {
    const wrap = el('div', { class: 'tabs' });
    const items = {};
    for (const t of tabs) {
      const btn = el('button', { class: 'tabs__item', type: 'button', 'data-key': t.key }, t.label);
      btn.addEventListener('click', () => select(t.key, true));
      wrap.appendChild(btn);
      items[t.key] = btn;
    }
    function select(key, fromUserClick = false) {
      for (const k of Object.keys(items)) {
        items[k].classList.toggle('is-active', k === key);
      }
      // 仅在用户点击时回调，避免初始化时无限递归
      if (fromUserClick && typeof onChange === 'function') onChange(key);
    }
    select(active, false);
    return { wrap, select };
  }

  global.tabs = { make };
})(window);
