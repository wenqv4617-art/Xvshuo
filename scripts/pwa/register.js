/* pwa/register.js — Service Worker 注册 + 更新检测 */
(function (global) {
  let refreshing = false;

  function onNeedRefresh() {
    if (refreshing) return;
    refreshing = true;
    if (global.toast) {
      global.toast.show({
        type: 'info',
        duration: 0,
        message: '已更新到最新版本，3 秒后自动刷新页面…'
      });
    }
    setTimeout(() => { location.reload(); }, 3000);
  }

  function register() {
    if (!('serviceWorker' in navigator)) return;
    // file:// 协议（如 Android WebView 内加载 assets）不支持 Service Worker，直接跳过
    if (location.protocol === 'file:') {
      console.info('[pwa] SW skipped: file:// protocol');
      return;
    }
    // WebViewAssetLoader 的虚拟 asset 域无真实 SW 能力，跳过
    if (location.hostname === 'appassets.androidplatform.net') {
      console.info('[pwa] SW skipped: WebView asset domain');
      return;
    }
    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
      console.info('[pwa] SW requires https or localhost');
    }
    navigator.serviceWorker.register('/sw.js?v=' + global.APP_VERSION)
      .then((reg) => {
        console.info('[pwa] SW registered', reg.scope);
        reg.addEventListener('updatefound', () => {
          const sw = reg.installing;
          if (!sw) return;
          sw.addEventListener('statechange', () => {
            if (sw.state === 'installed' && navigator.serviceWorker.controller) {
              onNeedRefresh();
            }
          });
        });
      })
      .catch((e) => console.warn('[pwa] register failed', e));

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // 静默触发，主流程在 onNeedRefresh 中处理
    });
  }

  global.pwa = { register };
})(window);
