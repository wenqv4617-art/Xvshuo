/* app.js — 应用入口：初始化 DB / SW / router / 全局事件 */
(function (global) {
  // 启动 DB
  document.addEventListener('DOMContentLoaded', () => {
    // 注册所有 page 模块
    if (global.pages) {
      for (const [k, mod] of Object.entries(global.pages)) {
        global.router.register(k, mod);
      }
    }

    // 全局事件：data-action
    document.body.addEventListener('click', (e) => {
      const t = e.target.closest('[data-action]');
      if (!t) return;
      const action = t.dataset.action;
      switch (action) {
        case 'toggle-sidenav':
          document.getElementById('sidenav').classList.toggle('is-open');
          document.getElementById('sidenavBackdrop').classList.toggle('is-open');
          break;
        case 'nav-settings':
          global.router.navigate('/settings'); break;
        case 'nav-archive':
          global.router.navigate('/archive'); break;
        case 'back-archive':
          global.router.navigate('/archive'); break;
        case 'nav-home':
          global.router.navigate('/'); break;
      }
    });

    // 注册 SW（如果支持）
    if ('serviceWorker' in navigator) {
      const { register } = global.pwa || {};
      if (register) register();
    }

    // 启动路由
    global.router.start();

    console.info('[app] Xvshuo started · v' + global.APP_VERSION);
  });
})(window);
