/* components/loading-overlay.js — 全屏加载遮罩 */
(function (global) {
  const { el } = global.dom;
  const root = () => document.getElementById('loadingRoot');
  let current = null;

  function show({ text = '正在生成…' } = {}) {
    if (current) hide();
    const overlay = el('div', { class: 'loading-overlay' });
    overlay.appendChild(el('div', { class: 'spinner' }));
    if (text) overlay.appendChild(el('div', { class: 'loading-overlay__text' }, text));
    root().appendChild(overlay);
    current = { overlay };
    return current;
  }
  function hide() {
    if (current && current.overlay) {
      current.overlay.remove();
      current = null;
    }
  }
  function update(text) {
    if (!current) return;
    let t = current.overlay.querySelector('.loading-overlay__text');
    if (!t) {
      t = el('div', { class: 'loading-overlay__text' });
      current.overlay.appendChild(t);
    }
    t.textContent = text;
  }

  global.loading = { show, hide, update };
})(window);
