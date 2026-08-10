/* pages/home.js — 主页入口（8 模块 4×2 小方块 + 大设置入口，无侧边栏） */
(function (global) {
  const { el } = global.dom;

  const ENTRIES = [
    { icon: 'user',    title: 'user 人设', route: '/user-gen' },
    { icon: 'char',    title: 'char 人设', route: '/char-gen' },
    { icon: 'book',    title: '世界书',    route: '/worldbook' },
    { icon: 'style',   title: '文风',      route: '/style' },
    { icon: 'regex',   title: '正则',      route: '/regex' },
    { icon: 'sparkle', title: '番外',      route: '/side-story' },
    { icon: 'layers',  title: 'HTML',      route: '/html-snippet' },
    { icon: 'archive', title: '档案库',    route: '/archive' }
  ];

  function mount() {
    const wrap = document.getElementById('homeEntries');
    if (!wrap) return;
    global.dom.clear(wrap);

    // 8 入口：4 列 × 2 行，小方块（仅图标 + 文字）
    const grid = el('div', { class: 'home-tiles' });
    for (const e of ENTRIES) {
      const tile = el('button', { class: 'home-tile', type: 'button', title: e.title });
      tile.insertAdjacentHTML('beforeend', `<span class="home-tile__icon">${global.icons.icon(e.icon, 26)}</span>`);
      tile.appendChild(el('span', { class: 'home-tile__label' }, e.title));
      tile.addEventListener('click', () => global.router.navigate(e.route));
      grid.appendChild(tile);
    }
    wrap.appendChild(grid);

    // 大设置入口
    const settingsCard = el('button', { class: 'home-settings-entry', type: 'button' });
    settingsCard.insertAdjacentHTML('beforeend', global.icons.icon('settings', 22));
    settingsCard.appendChild(el('span', null, '设置'));
    settingsCard.appendChild(el('span', { class: 'home-settings-entry__hint' }, 'API 协议 · 预设 · 数据管理'));
    settingsCard.appendChild(el('span', { class: 'home-settings-entry__arrow' }));
    settingsCard.querySelector('.home-settings-entry__arrow').insertAdjacentHTML('beforeend', global.icons.icon('arrow-right', 16));
    settingsCard.addEventListener('click', () => global.router.navigate('/settings'));
    wrap.appendChild(settingsCard);
  }

  function unmount() {}
  global.pages = global.pages || {};
  global.pages.home = { match: '/', mount, unmount };
})(window);
