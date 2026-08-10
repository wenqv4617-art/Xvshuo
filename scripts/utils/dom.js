/* utils/dom.js — DOM 工具 */
(function (global) {
  /** 创建一个元素（带属性、class、子节点、事件一步到位） */
  function el(tag, props = {}, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v == null || v === false) continue;
      if (k === 'class' || k === 'className') {
        node.className = Array.isArray(v) ? v.filter(Boolean).join(' ') : v;
      } else if (k === 'style' && typeof v === 'object') {
        Object.assign(node.style, v);
      } else if (k === 'dataset' && typeof v === 'object') {
        for (const [dk, dv] of Object.entries(v)) node.dataset[dk] = dv;
      } else if (k.startsWith('on') && typeof v === 'function') {
        node.addEventListener(k.slice(2).toLowerCase(), v);
      } else if (k === 'html') {
        node.innerHTML = v;
      } else if (k in node) {
        try { node[k] = v; } catch { node.setAttribute(k, v); }
      } else {
        node.setAttribute(k, v);
      }
    }
    appendChildren(node, children);
    return node;
  }
  function appendChildren(parent, children) {
    const arr = [].concat(...children).filter((c) => c != null && c !== false);
    for (const c of arr) {
      if (c instanceof Node) parent.appendChild(c);
      else if (typeof c === 'string' || typeof c === 'number') {
        parent.appendChild(document.createTextNode(String(c)));
      } else if (Array.isArray(c)) {
        appendChildren(parent, c);
      }
    }
  }
  function $(sel, root = document) { return root.querySelector(sel); }
  function $$(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }
  function on(sel, evt, handler, opts) {
    document.addEventListener(evt, (e) => {
      const t = e.target.closest(sel);
      if (t) handler.call(t, e, t);
    }, opts);
  }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function setText(node, text) { node.textContent = text == null ? '' : String(text); }

  global.dom = { el, $, $$, on, clear, setText };
})(window);
