/* components/ui.js — 通用 UI 组件 */
(function (global) {
  const { el, on } = global.dom;

  // 用法: Button(props, text) 或 Button(props, node)
  function Button(props = {}, text) {
    const { variant = 'primary', size, icon, block, ...rest } = props;
    const cls = ['btn', `btn--${variant}`];
    if (size) cls.push(`btn--${size}`);
    if (block) cls.push('btn--block');
    const node = el('button', { class: cls, ...rest });
    if (icon) node.insertAdjacentHTML('afterbegin', `<span class="btn__icon">${global.icons.icon(icon, size === 'sm' ? 14 : (size === 'lg' ? 18 : 16))}</span>`);
    if (text != null) {
      const span = el('span', { class: 'btn__label' });
      span.append(text instanceof Node ? text : document.createTextNode(String(text)));
      node.appendChild(span);
    }
    return node;
  }

  function IconBtn({ icon, danger, large, label, ...rest }) {
    const cls = ['icon-btn'];
    if (large) cls.push('icon-btn--lg');
    if (danger) cls.push('is-danger');
    return el('button', { class: cls, 'aria-label': label, title: label, ...rest, html: global.icons.icon(icon, large ? 18 : 16) });
  }

  function Input(props = {}) {
    const { label, hint, required, ...attrs } = props;
    const wrap = el('div', { class: 'field' });
    if (label) wrap.appendChild(el('label', { class: 'field__label' + (required ? ' field__required' : '') }, label));
    const node = el('input', { class: 'input', ...attrs });
    wrap.appendChild(node);
    if (hint) wrap.appendChild(el('div', { class: 'field__hint' }, hint));
    return wrap;
  }

  function Textarea(props = {}) {
    const { label, hint, required, rows = 5, ...attrs } = props;
    const wrap = el('div', { class: 'field' });
    if (label) wrap.appendChild(el('label', { class: 'field__label' + (required ? ' field__required' : '') }, label));
    const node = el('textarea', { class: 'textarea', rows, ...attrs });
    wrap.appendChild(node);
    if (hint) wrap.appendChild(el('div', { class: 'field__hint' }, hint));
    return wrap;
  }

  function Select({ label, hint, required, options = [], ...attrs }) {
    const wrap = el('div', { class: 'field' });
    if (label) wrap.appendChild(el('label', { class: 'field__label' + (required ? ' field__required' : '') }, label));
    const select = el('select', { class: 'select', ...attrs });
    for (const opt of options) {
      if (typeof opt === 'string') {
        select.appendChild(el('option', { value: opt }, opt));
      } else {
        select.appendChild(el('option', { value: opt.value }, opt.label));
      }
    }
    wrap.appendChild(select);
    if (hint) wrap.appendChild(el('div', { class: 'field__hint' }, hint));
    return wrap;
  }

  function Chip(props = {}) {
    const { text, selected, removable, onClick, ...rest } = props;
    const cls = ['chip'];
    if (selected) cls.push('is-selected');
    const node = el('button', { class: cls, type: 'button', ...rest });
    node.append(document.createTextNode(String(text)));
    if (removable) {
      const close = el('span', { class: 'chip__remove', html: global.icons.icon('close', 10) });
      close.addEventListener('click', (e) => { e.stopPropagation(); node.dispatchEvent(new CustomEvent('remove')); });
      node.appendChild(close);
    }
    if (onClick) node.addEventListener('click', onClick);
    return node;
  }

  function Spinner({ inline } = {}) {
    const n = el('div', { class: 'spinner' + (inline ? ' spinner--inline' : '') });
    return n;
  }

  function Divider({ strong } = {}) {
    return el('hr', { class: 'divider' + (strong ? ' divider--strong' : '') });
  }

  function EmptyState({ icon, title, hint, action }) {
    const wrap = el('div', { class: 'empty' });
    if (icon) wrap.insertAdjacentHTML('beforeend', `<div class="empty__icon">${global.icons.icon(icon, 48)}</div>`);
    wrap.appendChild(el('div', { class: 'empty__title' }, title || ''));
    if (hint) wrap.appendChild(el('div', { class: 'text-muted text-center', style: 'max-width:40ch;' }, hint));
    if (action) wrap.appendChild(action);
    return wrap;
  }

  function Fieldset({ title, num, children }) {
    const wrap = el('section', { class: 'detail-section' });
    const head = el('h3', { class: 'detail-section__title' });
    if (num) head.appendChild(el('span', { class: 'detail-section__num' }, String(num).padStart(2, '0')));
    head.append(document.createTextNode(title));
    wrap.appendChild(head);
    if (children) wrap.appendChild(children instanceof Node ? children : el('div', null, children));
    return wrap;
  }

  global.ui = { Button, IconBtn, Input, Textarea, Select, Chip, Spinner, Divider, EmptyState, Fieldset };
})(window);
