/* utils/debounce.js — 防抖 / 节流 */
(function (global) {
  function debounce(fn, wait = 200) {
    let t;
    return function debounced(...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }
  function throttle(fn, wait = 200) {
    let last = 0;
    let timer = null;
    return function throttled(...args) {
      const now = Date.now();
      const remain = wait - (now - last);
      if (remain <= 0) {
        last = now;
        fn.apply(this, args);
      } else if (!timer) {
        timer = setTimeout(() => { last = Date.now(); timer = null; fn.apply(this, args); }, remain);
      }
    };
  }
  global.debounce = debounce;
  global.throttle = throttle;
})(window);
