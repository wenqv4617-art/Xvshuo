/* components/modal.js — 自定义 Modal（取代 alert/confirm/prompt） */
(function (global) {
  const { el } = global.dom;
  const root = () => document.getElementById('modalRoot');

  let openCount = 0;

  function open({ title, body, footer, size, onClose, closeOnBackdrop = true }) {
    const cls = ['modal-card'];
    if (size === 'wide') cls.push('modal-card--wide');
    if (size === 'narrow') cls.push('modal-card--narrow');

    const card = el('div', { class: cls.join(' ') });
    const header = el('div', { class: 'modal-header' });
    header.appendChild(el('div', { class: 'modal-title' }, title || ''));
    const closeBtn = el('button', {
      class: 'icon-btn', 'aria-label': '关闭', type: 'button',
      html: global.icons.icon('close', 16)
    });
    header.appendChild(closeBtn);
    card.appendChild(header);

    const bodyEl = el('div', { class: 'modal-body' });
    if (body) {
      if (body instanceof Node) bodyEl.appendChild(body);
      else bodyEl.innerHTML = body;
    }
    card.appendChild(bodyEl);

    if (footer) {
      const f = el('div', { class: 'modal-footer' });
      if (Array.isArray(footer)) f.append(...footer);
      else f.appendChild(footer);
      card.appendChild(f);
    }

    const backdrop = el('div', { class: 'modal is-open' });
    backdrop.appendChild(card);

    function close() {
      backdrop.classList.remove('is-open');
      setTimeout(() => { backdrop.remove(); openCount = Math.max(0, openCount - 1); }, 200);
      if (typeof onClose === 'function') onClose();
    }

    closeBtn.addEventListener('click', close);
    if (closeOnBackdrop) {
      backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
    }

    root().appendChild(backdrop);
    openCount++;

    return { close, body: bodyEl, card };
  }

  function confirm({ title = '确认', message, confirmText = '确认', cancelText = '取消', danger } = {}) {
    return new Promise((resolve) => {
      const footer = el('div', { class: 'flex gap-3', style: 'justify-content:flex-end;width:100%;' });
      const cancelBtn = global.ui.Button({ variant: 'secondary' }, cancelText);
      const okBtn = global.ui.Button({ variant: danger ? 'danger' : 'primary' }, confirmText);
      const wrap = el('div', null, el('p', { class: 'text-soft' }, message || '确认此操作？'));
      let settled = false;
      function done(v) { if (!settled) { settled = true; resolve(v); m.close(); } }
      cancelBtn.addEventListener('click', () => done(false));
      okBtn.addEventListener('click', () => done(true));
      footer.append(cancelBtn, okBtn);
      const m = open({ title, body: wrap, footer });
    });
  }

  function prompt({ title, label, placeholder, defaultValue = '', type = 'text' } = {}) {
    return new Promise((resolve) => {
      const form = el('form', { class: 'flex flex-col gap-4' });
      const field = global.ui.Input({ label, placeholder, value: defaultValue });
      const input = field.querySelector('input');
      const footer = el('div', { class: 'flex gap-3', style: 'justify-content:flex-end;width:100%;' });
      const cancelBtn = global.ui.Button({ variant: 'secondary' }, '取消');
      const okBtn = global.ui.Button({ variant: 'primary' }, '确认');
      let settled = false;
      function done(v) { if (!settled) { settled = true; resolve(v); m.close(); } }
      cancelBtn.addEventListener('click', () => done(null));
      okBtn.addEventListener('click', () => done(input.value || null));
      form.addEventListener('submit', (e) => { e.preventDefault(); done(input.value || null); });
      footer.append(cancelBtn, okBtn);
      form.append(field, footer);
      const m = open({ title, body: form, size: 'narrow' });
      setTimeout(() => input.focus(), 50);
    });
  }

  function alert({ title, message, variant = 'info' } = {}) {
    return new Promise((resolve) => {
      const okBtn = global.ui.Button({ variant: 'primary' }, '知道了');
      const wrap = el('p', { class: 'text-soft' }, message || '');
      okBtn.addEventListener('click', () => { m.close(); resolve(true); });
      const m = open({ title, body: wrap, footer: okBtn, size: 'narrow' });
    });
  }

  global.modal = { open, close: () => { root().innerHTML = ''; openCount = 0; }, confirm, prompt, alert };
})(window);
