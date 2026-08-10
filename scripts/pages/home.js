/* pages/home.js — 主页入口（8 模块 + 大设置入口，无侧边栏） */
(function (global) {
  const { el } = global.dom;

  const ENTRIES = [
    { num: '01', icon: 'user',     title: 'user 人设', desc: '构造并生成 user 角色档案', route: '/user-gen' },
    { num: '02', icon: 'char',     title: 'char 人设', desc: '构造并生成 char 角色档案（含 3 段开场白）', route: '/char-gen' },
    { num: '03', icon: 'book',     title: '世界书',     desc: '挂载 user/char，构造世界观', route: '/worldbook' },
    { num: '04', icon: 'style',    title: '文风',       desc: '对 AI 输出施加最高风格约束', route: '/style' },
    { num: '05', icon: 'regex',    title: '正则',       desc: 'AI 生成正则 + 沙箱实时预览', route: '/regex' },
    { num: '06', icon: 'sparkle',  title: '番外',       desc: '输入灵感，扩写为番外提示词', route: '/side-story' },
    { num: '07', icon: 'layers',   title: 'HTML',       desc: '输入灵感，生成指令头与 HTML 模板', route: '/html-snippet' },
    { num: '08', icon: 'archive',  title: '档案库',     desc: '查看 / 编辑 / 导出所有产物', route: '/archive' }
  ];

  function mount() {
    const wrap = document.getElementById('homeEntries');
    if (!wrap) return;
    global.dom.clear(wrap);

    // 8 入口网格（4×2）
    const grid = el('div', { class: 'grid-cards' });
    for (const e of ENTRIES) {
      const card = el('button', { class: 'entry-card', type: 'button' });
      const head = el('div', { class: 'entry-card__head' });
      head.appendChild(el('div', { class: 'entry-card__num' }, e.num));
      head.insertAdjacentHTML('beforeend', `<span class="entry-card__icon">${global.icons.icon(e.icon, 28)}</span>`);
      card.appendChild(head);
      card.appendChild(el('div', { class: 'entry-card__title' }, e.title));
      card.appendChild(el('div', { class: 'entry-card__desc' }, e.desc));
      const arrow = el('div', { class: 'entry-card__arrow' });
      arrow.append(document.createTextNode('ENTER'));
      arrow.insertAdjacentHTML('beforeend', ` ${global.icons.icon('arrow-right', 14)}`);
      card.appendChild(arrow);
      card.addEventListener('click', () => global.router.navigate(e.route));
      grid.appendChild(card);
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
