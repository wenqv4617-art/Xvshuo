/* router.js — 路由管理（history API + hash fallback）
 * 侧边栏按页面上下文切换：主页=主菜单；user/char 生成=板块导航；
 * 档案库=五类档案；设置=两个 Tab；非主页显示返回按钮
 */
(function (global) {
  const { $ } = global.dom;
  const pages = {}; // pageKey -> { mount(params), unmount() }
  let currentKey = null;
  let useHash = false;

  const BASE_PATH = (document.querySelector('base') && document.querySelector('base').href) || window.BASE_PATH || '/';

  function normalizePath(path) {
    if (!path) path = '/';
    if (path[0] !== '/') path = '/' + path;
    if (path !== '/' && path.endsWith('/')) path = path.slice(0, -1);
    return path;
  }

  function register(key, module) { pages[key] = module; }

  function parsePath(path) {
    path = normalizePath(path);
    for (const pattern of Object.keys(pages).sort((a, b) => b.length - a.length)) {
      const meta = pages[pattern];
      if (typeof meta !== 'object' || !meta.match) continue;
      const re = new RegExp('^' + meta.match.replace(/:([^/]+)/g, '([^/]+)') + '$');
      const m = path.match(re);
      if (m) {
        const params = {};
        const keys = (meta.match.match(/:([^/]+)/g) || []).map((s) => s.slice(1));
        keys.forEach((k, i) => { params[k] = decodeURIComponent(m[i + 1]); });
        return { key: pattern, params, path };
      }
    }
    return null;
  }

  function show(path) {
    path = normalizePath(path);
    const parsed = parsePath(path);
    if (!parsed) {
      if (path !== '/') {
        navigate('/');
        return;
      }
      return;
    }
    const { key, params } = parsed;
    // 隐藏所有 page section
    document.querySelectorAll('.page.is-active').forEach((s) => s.classList.remove('is-active'));

    // 显示目标（HTML 里 data-page 只用 base key，如 'user-gen/:panel' → 'user-gen'）
    const baseKey = key.split('/')[0];
    const section = document.querySelector(`.page[data-page="${baseKey}"]`);
    if (section) section.classList.add('is-active');

    // 单级页头：topbar 标题随页面切换
    updateTopbar(baseKey, params, path);

    // 主页无侧边栏（全宽）；其他页面恢复侧边栏
    document.body.classList.toggle('no-sidenav', baseKey === 'home');

    // 卸载上一个
    if (currentKey && pages[currentKey] && typeof pages[currentKey].unmount === 'function') {
      try { pages[currentKey].unmount(); } catch (e) { console.warn('[router] unmount', e); }
    }
    // 挂载当前
    if (typeof pages[key].mount === 'function') {
      try { pages[key].mount(params); } catch (e) { console.error('[router] mount', key, e); }
    }

    currentKey = key;
    global.store.set('currentPage', { key, params, path });
    window.scrollTo({ top: 0, behavior: 'instant' });

    // 底部操作栏：严格按当前页归属显示，user 页隐藏 char 栏、char 页隐藏 user 栏
    const isUserPage = key === 'user-gen' || key === 'user-gen/:panel';
    const isCharPage = key === 'char-gen' || key === 'char-gen/:panel';
    const userBar = document.getElementById('userGenActionBar');
    const charBar = document.getElementById('charGenActionBar');
    if (userBar) userBar.style.display = isUserPage ? '' : 'none';
    if (charBar) charBar.style.display = isCharPage ? '' : 'none';

    // 上下文侧边栏
    renderSidenav(key, params, path);

    // 关闭移动端抽屉
    const sn = document.getElementById('sidenav');
    const bd = document.getElementById('sidenavBackdrop');
    if (sn) sn.classList.remove('is-open');
    if (bd) bd.classList.remove('is-open');
  }

  function navigate(path, replace = false) {
    path = normalizePath(path);
    if (useHash) {
      const target = '#' + path;
      if (replace) location.replace(target);
      else if (location.hash !== target) location.hash = target;
    } else {
      if (replace) history.replaceState(null, '', path);
      else history.pushState(null, '', path);
    }
    show(path);
  }

  function start() {
    useHash = !window.history || !window.history.pushState;
    renderSidenav(null, {}, '/');
    // 监听
    if (useHash) {
      window.addEventListener('hashchange', () => show(location.hash.slice(1) || '/'));
      const cur = location.hash.slice(1) || '/';
      if (!cur) location.replace('#/');
      show(cur);
    } else {
      window.addEventListener('popstate', () => show(location.pathname || '/'));
      show(location.pathname || '/');
    }
  }

  /* ================= 单级页头（topbar 随页面切换） ================= */

  const PAGE_META = {
    home:         { title: '叙说 Xvshuo',      eyebrow: 'AI PERSONA ATELIER' },
    settings:     { title: '设置',              eyebrow: 'SYSTEM' },
    'user-gen':   { title: 'User 人设生成',    eyebrow: 'CREATE · USER' },
    'char-gen':   { title: 'Char 人设生成',    eyebrow: 'CREATE · CHAR' },
    archive:      { title: '档案库',            eyebrow: 'LIBRARY' },
    worldbook:    { title: '世界书',            eyebrow: 'LOREBOOK' },
    style:        { title: '文风',              eyebrow: 'PROSE STYLE' },
    regex:        { title: '正则 · 文字替换',  eyebrow: 'REGEX SANDBOX' },
    'side-story': { title: '番外',              eyebrow: 'SIDE STORY' },
    'html-snippet': { title: 'HTML',            eyebrow: 'HTML FORGE' }
  };
  // 档案库分类 eyebrow
  const ARCHIVE_EYEBROW = { user: 'USER', char: 'CHAR', regex: 'REGEX', sideStory: 'SIDE STORY', html: 'HTML' };
  // 设置 Tab eyebrow
  const SETTINGS_EYEBROW = { api: 'API', data: 'DATA' };

  function updateTopbar(baseKey, params, path) {
    const tEl = document.getElementById('topbarTitle');
    const eEl = document.getElementById('topbarEyebrow');
    if (!tEl) return;
    if (baseKey === 'home') {
      tEl.innerHTML = '叙说 <span class="topbar__title-en">Xvshuo</span>';
      eEl.textContent = 'AI PERSONA ATELIER';
    } else {
      const meta = PAGE_META[baseKey] || { title: '叙说 Xvshuo', eyebrow: '' };
      tEl.textContent = meta.title;
      let eyebrow = meta.eyebrow || '';
      if (baseKey === 'archive') eyebrow = ARCHIVE_EYEBROW[params.kind] || eyebrow;
      if (baseKey === 'settings') eyebrow = SETTINGS_EYEBROW[params.tab] || eyebrow;
      eEl.textContent = eyebrow;
    }
  }

  /* ================= 上下文侧边栏 ================= */

  // user/char 生成页的 11 个板块（数组保证顺序）
  const GEN_PANELS = [
    ['01', '绑定'], ['02', '基础信息'], ['03', '外貌锚点'], ['04', '性格特征'], ['05', '挂载世界书'],
    ['06', '世界背景'], ['07', '剧本走向'], ['08', '关系网'], ['09', '职业生涯'], ['10', '挂载文风'], ['11', '额外信息']
  ];
  // 档案库五类
  const ARCHIVE_KINDS = [
    { key: 'user', label: 'user', icon: 'user' },
    { key: 'char', label: 'char', icon: 'char' },
    { key: 'regex', label: '正则', icon: 'regex' },
    { key: 'sideStory', label: '番外', icon: 'sparkle' },
    { key: 'html', label: 'HTML', icon: 'layers' }
  ];
  // 设置两个 Tab
  const SETTINGS_TABS = [
    { key: 'api', label: 'API 设置', icon: 'settings' },
    { key: 'data', label: '数据管理', icon: 'database' }
  ];

  function renderSidenav(key, params, path) {
    const list = document.getElementById('sidenavList');
    const backBtn = document.getElementById('sidenavBack');
    if (!list) return;

    // 返回按钮：非主页显示
    const isHome = key === 'home' || path === '/' || (!key && path === '/');
    if (backBtn) {
      backBtn.style.display = isHome ? 'none' : '';
      backBtn.onclick = () => navigate('/');
    }

    list.innerHTML = '';
    const groupLabel = list.parentElement.querySelector('.sidenav__group-label');

    if (key === 'user-gen' || key === 'user-gen/:panel') {
      if (groupLabel) groupLabel.textContent = 'user 人设生成 · 板块';
      GEN_PANELS.forEach(([num, name]) => {
        const route = '/user-gen/' + num;
        const btn = makeNavItem({ num, label: num + ' · ' + name }, path === route);
        btn.addEventListener('click', () => navigate(route));
        list.appendChild(btn);
      });
      return;
    }

    if (key === 'char-gen' || key === 'char-gen/:panel') {
      if (groupLabel) groupLabel.textContent = 'char 人设生成 · 板块';
      GEN_PANELS.forEach(([num, name]) => {
        const route = '/char-gen/' + num;
        const btn = makeNavItem({ num, label: num + ' · ' + name }, path === route);
        btn.addEventListener('click', () => navigate(route));
        list.appendChild(btn);
      });
      return;
    }

    if (key === 'archive' || key === 'archive/:kind') {
      if (groupLabel) groupLabel.textContent = '档案库';
      ARCHIVE_KINDS.forEach((k) => {
        const route = '/archive/' + k.key;
        const active = (params.kind || 'user') === k.key;
        const btn = makeNavItem({ num: '', label: k.label, icon: k.icon }, active);
        btn.addEventListener('click', () => navigate(route));
        list.appendChild(btn);
      });
      return;
    }

    if (key === 'settings' || key === 'settings/:tab') {
      if (groupLabel) groupLabel.textContent = '设置';
      SETTINGS_TABS.forEach((k) => {
        const route = '/settings/' + k.key;
        const active = (params.tab || 'api') === k.key;
        const btn = makeNavItem({ num: '', label: k.label, icon: k.icon }, active);
        btn.addEventListener('click', () => navigate(route));
        list.appendChild(btn);
      });
      return;
    }

    // 默认：主菜单
    if (groupLabel) groupLabel.textContent = '主菜单';
    const nav = [
      { key: 'home',         route: '/',              label: '主页',   num: '01', icon: 'home' },
      { key: 'user-gen',     route: '/user-gen',      label: 'user 人设', num: '02', icon: 'user' },
      { key: 'char-gen',     route: '/char-gen',      label: 'char 人设', num: '03', icon: 'char' },
      { key: 'worldbook',    route: '/worldbook',     label: '世界书',   num: '04', icon: 'book' },
      { key: 'style',        route: '/style',         label: '文风',     num: '05', icon: 'style' },
      { key: 'regex',        route: '/regex',         label: '正则',     num: '06', icon: 'regex' },
      { key: 'side-story',   route: '/side-story',    label: '番外',     num: '07', icon: 'sparkle' },
      { key: 'html-snippet', route: '/html-snippet',  label: 'HTML',     num: '08', icon: 'layers' },
      { key: 'archive',      route: '/archive',       label: '档案库',   num: '09', icon: 'archive' }
    ];
    for (const n of nav) {
      const btn = makeNavItem(n, path === n.route || key === n.key);
      btn.addEventListener('click', () => navigate(n.route));
      list.appendChild(btn);
    }
    list.appendChild(makeDivider());
    const settingsBtn = makeNavItem({ key: 'settings', route: '/settings', label: '设置', num: '·', icon: 'settings' }, key === 'settings' || key === 'settings/:tab');
    settingsBtn.addEventListener('click', () => navigate('/settings'));
    list.appendChild(settingsBtn);
  }

  function makeNavItem(n, active) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sidenav__item' + (active ? ' is-active' : '');
    if (n.icon) {
      btn.innerHTML = `${global.icons.icon(n.icon, 18)}<span class="sidenav__label">${n.label}</span>${n.num ? `<span class="sidenav__num">${n.num}</span>` : ''}`;
    } else {
      btn.innerHTML = `<span class="sidenav__num" style="min-width:22px;margin-left:0;opacity:0.55;">${n.num}</span><span class="sidenav__label">${n.label}</span>`;
    }
    return btn;
  }

  function makeDivider() {
    const d = document.createElement('div');
    d.className = 'sidenav__divider';
    return d;
  }

  function current() { return currentKey; }

  global.router = { register, navigate, start, current, normalizePath };
})(window);
