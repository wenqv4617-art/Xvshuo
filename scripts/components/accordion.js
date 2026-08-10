/* components/accordion.js — 手风琴组件（多级嵌套） */
(function (global) {
  const { el } = global.dom;

  /**
   * @param {object} cfg
   * @param {string} cfg.num        板块编号，如 "01"
   * @param {string} cfg.title      标题
   * @param {string} [cfg.hint]     右侧提示
   * @param {Node|string} cfg.body  内容
   * @param {boolean} [cfg.open]    默认展开
   * @param {boolean} [cfg.single]  同一父节点内只展开一个
   */
  function Item({ num, title, hint, body, open = false, single = false, parent }) {
    const item = el('div', { class: 'accordion-item' + (open ? ' is-open' : '') });

    const header = el('button', { class: 'accordion-header', type: 'button' });
    const meta = el('div', { class: 'accordion-meta' });
    if (num) meta.appendChild(el('span', { class: 'accordion-num' }, String(num)));
    if (title) meta.appendChild(el('span', { class: 'accordion-title' }, title));
    header.appendChild(meta);
    const right = el('div', { class: 'flex items-center gap-2' });
    if (hint) right.appendChild(el('span', { class: 'text-muted', style: 'font-size:var(--fs-xs);text-transform:uppercase;letter-spacing:0.12em;' }, hint));
    right.insertAdjacentHTML('beforeend', `<span class="accordion-chevron">${global.icons.icon('chevron-down', 18)}</span>`);
    header.appendChild(right);

    const bodyWrap = el('div', { class: 'accordion-body' });
    const inner = el('div', { class: 'accordion-inner' });
    if (body) inner.appendChild(body instanceof Node ? body : el('div', null, body));
    bodyWrap.appendChild(inner);

    item.append(header, bodyWrap);

    header.addEventListener('click', () => {
      const willOpen = !item.classList.contains('is-open');
      if (single && willOpen && parent) {
        parent.querySelectorAll('.accordion-item.is-open').forEach((n) => {
          if (n !== item) n.classList.remove('is-open');
        });
      }
      item.classList.toggle('is-open', willOpen);
    });

    return { item, open: (v) => item.classList.toggle('is-open', !!v) };
  }

  global.accordion = { Item };
})(window);
