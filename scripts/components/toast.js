/* components/toast.js — 卡片 Toast（成功/错误/警告/信息） */
(function (global) {
  const { el } = global.dom;
  const root = () => document.getElementById('toastRoot');
  const VARIANTS = {
    success: { icon: 'success', cls: 'toast--success' },
    error:   { icon: 'error',   cls: 'toast--error' },
    warn:    { icon: 'warn',    cls: 'toast--warn' },
    info:    { icon: 'info',    cls: 'toast--info' }
  };

  function show({ type = 'info', message = '', duration = 3000 } = {}) {
    const conf = VARIANTS[type] || VARIANTS.info;
    const node = el('div', { class: `toast ${conf.cls}` });
    node.insertAdjacentHTML('afterbegin', `<span class="toast__icon">${global.icons.icon(conf.icon, 18)}</span>`);
    node.appendChild(el('span', { class: 'toast__msg' }, message));
    const close = el('button', { class: 'toast__close', 'aria-label': '关闭', html: global.icons.icon('close', 12) });
    let timer;
    function dismiss() {
      node.classList.add('is-leaving');
      setTimeout(() => node.remove(), 200);
      clearTimeout(timer);
    }
    close.addEventListener('click', dismiss);
    node.appendChild(close);
    root().appendChild(node);
    if (duration > 0) timer = setTimeout(dismiss, duration);
    return dismiss;
  }

  function success(msg, dur) { return show({ type: 'success', message: msg, duration: dur }); }
  function error(msg, dur)   { return show({ type: 'error', message: msg, duration: dur || 5000 }); }
  function warn(msg, dur)    { return show({ type: 'warn', message: msg, duration: dur }); }
  function info(msg, dur)    { return show({ type: 'info', message: msg, duration: dur }); }

  global.toast = { show, success, error, warn, info };
})(window);
