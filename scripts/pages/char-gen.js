/* pages/char-gen.js — char 人设生成页（每页一个板块，侧边栏切换；对称 user + 3 开场白） */
(function (global) {
  const { el } = global.dom;
  let state = {
    form: {
      name: '', gender: '男', age: '', group: '',
      boundUserId: null, boundUserName: '', boundUserBrief: '',
      relation: '',
      appearanceTags: { hair: [], face: [], clothing: [] },
      personalityTags: [],
      worldbookIds: [], styleIds: [],
      worldBackgroundTags: [], plotDirectionTags: [], relationshipsTags: [], careerTags: [],
      extraInfo: ''
    },
    activeCat: 'hair',
    users: [],
    worldbooks: [],
    styles: [],
    customTags: [],
    currentPanel: '01',
    barCollapsed: false
  };

  const GENDER_MAP = { '男': 'male', '女': 'female', '不限': 'all' };

  const PANELS = [
    { num: '01', name: '绑定 user' },
    { num: '02', name: '基础信息' },
    { num: '03', name: '外貌锚点' },
    { num: '04', name: '性格特征' },
    { num: '05', name: '挂载世界书' },
    { num: '06', name: '世界背景' },
    { num: '07', name: '剧本走向' },
    { num: '08', name: '关系网' },
    { num: '09', name: '职业生涯' },
    { num: '10', name: '挂载文风' },
    { num: '11', name: '额外信息' }
  ];

  async function load() {
    state.users = await global.xvdb.all('userPersonas');
    state.worldbooks = await global.xvdb.all('worldbooks');
    state.styles = await global.xvdb.all('styles');
    state.customTags = await global.xvdb.all('customTags');
    render();
  }

  function mount(params) {
    if (params && params.panel) state.currentPanel = params.panel;
    load();
  }
  function unmount() {
    // 离开 char 生成页时自动隐藏底部操作栏
    const bar = document.getElementById('charGenActionBar');
    if (bar) bar.style.display = 'none';
  }

  function panelIndex() {
    const i = PANELS.findIndex((p) => p.num === state.currentPanel);
    return i < 0 ? 0 : i;
  }

  function render() {
    const root = document.getElementById('charGenMount');
    if (!root) return;
    global.dom.clear(root);

    // 当前板块标题条
    const cur = PANELS[panelIndex()];
    const headBar = el('div', { class: 'gen-panel-headbar' });
    headBar.appendChild(el('span', { class: 'gen-panel-headbar__num' }, cur.num));
    headBar.appendChild(el('span', { class: 'gen-panel-headbar__name' }, cur.name));
    const navBtns = el('div', { class: 'flex gap-2' });
    if (panelIndex() > 0) {
      const prevBtn = global.ui.IconBtn({ icon: 'chevron-left', label: '上一板块' });
      prevBtn.addEventListener('click', () => global.router.navigate('/char-gen/' + PANELS[panelIndex() - 1].num));
      navBtns.appendChild(prevBtn);
    }
    if (panelIndex() < PANELS.length - 1) {
      const nextBtn = global.ui.IconBtn({ icon: 'chevron-right', label: '下一板块' });
      nextBtn.addEventListener('click', () => global.router.navigate('/char-gen/' + PANELS[panelIndex() + 1].num));
      navBtns.appendChild(nextBtn);
    }
    headBar.appendChild(navBtns);
    root.appendChild(headBar);

    const body = el('div', { class: 'gen-panel-solo' });
    body.appendChild(renderPanelByNum(cur.num));
    root.appendChild(body);

    renderActionBar();
  }

  function renderPanelByNum(num) {
    switch (num) {
      case '01': return renderPanel1();
      case '02': return renderPanel2();
      case '03': return renderPanel3();
      case '04': return renderPanel4();
      case '05': return renderMountPicker('worldbooks', 'worldbookIds', '世界书', 'book');
      case '06': return renderTagPanel('worldBackgroundTags', global.TAGS_SCENARIO.worldBackground, 'worldBackground');
      case '07': return renderTagPanel('plotDirectionTags', global.TAGS_SCENARIO.plotDirection, 'plotDirection');
      case '08': return renderTagPanel('relationshipsTags', global.TAGS_SCENARIO.relationships, 'relationships');
      case '09': return renderTagPanel('careerTags', global.TAGS_SCENARIO.career, 'career');
      case '10': return renderMountPicker('styles', 'styleIds', '文风', 'style');
      case '11': return renderPanelText('extraInfo', '任何想补充的内容…');
      default: return renderPanel1();
    }
  }

  function customTagsOf(prefix) {
    return state.customTags
      .filter((t) => t.category && t.category.startsWith(prefix))
      .map((t) => t.value);
  }

  function renderTagPanel(formKey, categories, catPrefix) {
    const wrap = el('div', { class: 'flex flex-col gap-4' });
    const sel = new Set(state.form[formKey]);
    const removable = new Set(customTagsOf(catPrefix));
    const tagLib = global.taglib.make({
      categories: categories || [],
      selected: sel,
      removable,
      onChange: (newSel) => { state.form[formKey] = Array.from(newSel); },
      allowAdd: true,
      onAdd: async (catKey, value) => {
        await global.xvdb.put('customTags', {
          id: global.uid(),
          category: catPrefix + '-' + catKey,
          gender: 'all',
          value,
          createdAt: new Date().toISOString()
        });
        state.customTags.push({ category: catPrefix + '-' + catKey, value });
        const cat = (categories || []).find((c) => c.key === catKey);
        if (cat) cat.tags.push(value);
        render();
      },
      onRemove: async (catKey, value) => {
        const prefix = catPrefix + '-' + catKey;
        await global.xvdb.delWhereFn('customTags', (t) => t.category === prefix && t.value === value);
        state.customTags = state.customTags.filter((t) => !(t.category === prefix && t.value === value));
        const ns = new Set(state.form[formKey]);
        ns.delete(value);
        state.form[formKey] = Array.from(ns);
        global.toast.success('已删除标签「' + value + '」');
        render();
      },
      onClearCat: async (catKey) => {
        const prefix = catPrefix + '-' + catKey;
        const removed = state.customTags.filter((t) => t.category === prefix);
        await global.xvdb.delWhereFn('customTags', (t) => t.category === prefix);
        state.customTags = state.customTags.filter((t) => t.category !== prefix);
        const ns = new Set(state.form[formKey]);
        removed.forEach((t) => ns.delete(t.value));
        state.form[formKey] = Array.from(ns);
        global.toast.success(removed.length ? '已删除该分类的 ' + removed.length + ' 个自定义标签' : '该分类没有自定义标签');
        render();
      }
    });
    wrap.appendChild(tagLib.root);
    return wrap;
  }

  function renderPanel1() {
    const wrap = el('div', { class: 'flex flex-col gap-4' });
    const relationField = el('div', { class: 'field' });
    relationField.appendChild(el('label', { class: 'field__label' }, '与此人关系标签'));
    const relationChips = el('div', { class: 'taglib-tags' });
    (global.TAGS_RELATIONS || []).forEach((r) => {
      const chip = el('button', { class: 'chip' + (state.form.relation === r ? ' is-selected' : ''), type: 'button' }, r);
      chip.addEventListener('click', () => {
        state.form.relation = state.form.relation === r ? '' : r;
        render();
      });
      relationChips.appendChild(chip);
    });
    relationField.appendChild(relationChips);
    wrap.appendChild(relationField);

    const userField = el('div', { class: 'field' });
    userField.appendChild(el('label', { class: 'field__label' }, '绑定 user'));
    const row = el('div', { class: 'input-group' });
    const disp = el('input', { class: 'input', readonly: true, value: state.form.boundUserName || '', placeholder: '点击右侧选择 user…' });
    const pickBtn = global.ui.Button({ variant: 'secondary', icon: 'link' }, '选择');
    pickBtn.addEventListener('click', () => openUserPicker());
    const clearBtn = global.ui.Button({ variant: 'ghost', icon: 'close' }, '清除');
    clearBtn.addEventListener('click', () => {
      state.form.boundUserId = null;
      state.form.boundUserName = '';
      state.form.boundUserBrief = '';
      render();
    });
    row.append(disp, pickBtn, clearBtn);
    userField.appendChild(row);
    if (state.form.boundUserName) {
      userField.appendChild(el('div', { class: 'field__hint' }, '已绑定：' + state.form.boundUserName));
    }
    wrap.appendChild(userField);
    return wrap;
  }

  function openUserPicker() {
    const body = el('div', { class: 'flex flex-col gap-2' });
    if (!state.users.length) {
      body.appendChild(global.ui.EmptyState({ icon: 'user', title: '暂无 user', hint: '请先在 user 人设入口创建' }));
    } else {
      for (const u of state.users) {
        const item = el('div', { class: 'archive-card', style: 'cursor:pointer;' });
        item.appendChild(el('div', { class: 'archive-card__title' }, u.name || '(未命名)'));
        item.appendChild(el('div', { class: 'archive-card__meta' }, global.fmt.fmtRelative(u.updatedAt || u.createdAt)));
        item.addEventListener('click', () => {
          state.form.boundUserId = u.id;
          state.form.boundUserName = u.name;
          state.form.boundUserBrief = u.generatedResult ? JSON.stringify(u.generatedResult).slice(0, 300) : '';
          m.close();
          render();
        });
        body.appendChild(item);
      }
    }
    const m = global.modal.open({ title: '选择 user', body, size: 'wide' });
  }

  function renderPanel2() {
    const grid = el('div', { class: 'form-grid' });
    const nameField = global.ui.Input({ label: '姓名', value: state.form.name, placeholder: '如：沈砚' });
    nameField.querySelector('input').addEventListener('input', (e) => state.form.name = e.target.value);
    grid.appendChild(nameField);

    const genderField = el('div', { class: 'field' });
    genderField.appendChild(el('label', { class: 'field__label' }, '性别'));
    const sel = el('select', { class: 'select' });
    ['男', '女', '不限'].forEach((g) => {
      const o = el('option', { value: g }, g);
      if (state.form.gender === g) o.selected = true;
      sel.appendChild(o);
    });
    sel.addEventListener('change', (e) => {
      state.form.gender = e.target.value;
      render();
    });
    genderField.appendChild(sel);
    grid.appendChild(genderField);

    const ageField = global.ui.Input({ label: '年龄', value: state.form.age });
    ageField.querySelector('input').addEventListener('input', (e) => state.form.age = e.target.value);
    grid.appendChild(ageField);

    const groupField = global.ui.Input({ label: '分组', value: state.form.group });
    groupField.querySelector('input').addEventListener('input', (e) => state.form.group = e.target.value);
    grid.appendChild(groupField);
    return grid;
  }

  function renderPanel3() {
    const wrap = el('div', { class: 'flex flex-col gap-4' });
    const catTabs = global.tabs.make(
      [{ key: 'hair', label: '发型' }, { key: 'face', label: '面部锚点' }, { key: 'clothing', label: '穿衣风格' }],
      state.activeCat,
      (k) => { state.activeCat = k; render(); }
    );
    wrap.appendChild(catTabs.wrap);

    const cat = state.activeCat;
    const genderKey = GENDER_MAP[state.form.gender] === 'all' ? null : GENDER_MAP[state.form.gender];
    const data = global.TAGS_APPEARANCE?.[cat];
    if (!data) return wrap;

    let categories = [];
    if (genderKey === null) {
      const f = data.female || [];
      const m = data.male || [];
      categories = [...f.map((c) => ({ ...c, label: c.label + '（女）' })), ...m.map((c) => ({ ...c, label: c.label + '（男）' }))];
    } else {
      categories = data[genderKey] || [];
    }
    if (!categories.length) return wrap;

    const sel = state.form.appearanceTags[cat] || (state.form.appearanceTags[cat] = []);
    const removable = new Set(customTagsOf(cat + '-'));
    const tagLib = global.taglib.make({
      categories,
      selected: new Set(sel),
      removable,
      onChange: (newSel) => { state.form.appearanceTags[cat] = Array.from(newSel); },
      allowAdd: true,
      onAdd: async (catKey, value) => {
        await global.xvdb.put('customTags', {
          id: global.uid(),
          category: cat + '-' + catKey,
          gender: genderKey || 'all',
          value,
          createdAt: new Date().toISOString()
        });
        state.customTags.push({ category: cat + '-' + catKey, value });
        const c2 = categories.find((c) => c.key === catKey);
        if (c2) c2.tags.push(value);
        render();
      },
      onRemove: async (catKey, value) => {
        const prefix = cat + '-' + catKey;
        await global.xvdb.delWhereFn('customTags', (t) => t.category === prefix && t.value === value);
        state.customTags = state.customTags.filter((t) => !(t.category === prefix && t.value === value));
        const ns = new Set(state.form.appearanceTags[cat]);
        ns.delete(value);
        state.form.appearanceTags[cat] = Array.from(ns);
        global.toast.success('已删除标签「' + value + '」');
        render();
      },
      onClearCat: async (catKey) => {
        const prefix = cat + '-' + catKey;
        const removed = state.customTags.filter((t) => t.category === prefix);
        await global.xvdb.delWhereFn('customTags', (t) => t.category === prefix);
        state.customTags = state.customTags.filter((t) => t.category !== prefix);
        const ns = new Set(state.form.appearanceTags[cat]);
        removed.forEach((t) => ns.delete(t.value));
        state.form.appearanceTags[cat] = Array.from(ns);
        global.toast.success(removed.length ? '已删除该分类的 ' + removed.length + ' 个自定义标签' : '该分类没有自定义标签');
        render();
      }
    });
    wrap.appendChild(tagLib.root);
    return wrap;
  }

  function renderPanel4() {
    const wrap = el('div', { class: 'flex flex-col gap-4' });
    const sel = new Set(state.form.personalityTags);
    const removable = new Set(customTagsOf('personality-'));
    const tagLib = global.taglib.make({
      categories: global.TAGS_PERSONALITY || [],
      selected: sel,
      removable,
      onChange: (newSel) => { state.form.personalityTags = Array.from(newSel); },
      allowAdd: true,
      onAdd: async (catKey, value) => {
        await global.xvdb.put('customTags', {
          id: global.uid(),
          category: 'personality-' + catKey,
          gender: 'all',
          value,
          createdAt: new Date().toISOString()
        });
        state.customTags.push({ category: 'personality-' + catKey, value });
        const cat = (global.TAGS_PERSONALITY || []).find((c) => c.key === catKey);
        if (cat) cat.tags.push(value);
        render();
      },
      onRemove: async (catKey, value) => {
        const prefix = 'personality-' + catKey;
        await global.xvdb.delWhereFn('customTags', (t) => t.category === prefix && t.value === value);
        state.customTags = state.customTags.filter((t) => !(t.category === prefix && t.value === value));
        const ns = new Set(state.form.personalityTags);
        ns.delete(value);
        state.form.personalityTags = Array.from(ns);
        global.toast.success('已删除标签「' + value + '」');
        render();
      },
      onClearCat: async (catKey) => {
        const prefix = 'personality-' + catKey;
        const removed = state.customTags.filter((t) => t.category === prefix);
        await global.xvdb.delWhereFn('customTags', (t) => t.category === prefix);
        state.customTags = state.customTags.filter((t) => t.category !== prefix);
        const ns = new Set(state.form.personalityTags);
        removed.forEach((t) => ns.delete(t.value));
        state.form.personalityTags = Array.from(ns);
        global.toast.success(removed.length ? '已删除该分类的 ' + removed.length + ' 个自定义标签' : '该分类没有自定义标签');
        render();
      }
    });
    wrap.appendChild(tagLib.root);
    return wrap;
  }

  function renderMountPicker(table, stateKey, label, icon) {
    const wrap = el('div', { class: 'flex flex-col gap-3' });
    const items = state[table] || [];
    if (!items.length) {
      wrap.appendChild(global.ui.EmptyState({ icon, title: `暂无${label}`, hint: `请先创建${label}` }));
      return wrap;
    }
    for (const s of items) {
      const selected = state.form[stateKey].includes(s.id);
      const chip = el('button', { class: 'chip' + (selected ? ' is-selected' : ''), type: 'button' }, s.name || '(未命名)');
      chip.addEventListener('click', () => {
        if (selected) {
          state.form[stateKey] = state.form[stateKey].filter((id) => id !== s.id);
        } else {
          state.form[stateKey].push(s.id);
        }
        render();
      });
      wrap.appendChild(chip);
    }
    return wrap;
  }

  function renderPanelText(field, placeholder) {
    const f = global.ui.Textarea({ value: state.form[field], rows: 5, placeholder });
    f.querySelector('textarea').addEventListener('input', (e) => state.form[field] = e.target.value);
    return f;
  }

  function renderActionBar() {
    let bar = document.getElementById('charGenActionBar');
    if (!bar) {
      bar = el('div', { class: 'gen-actionbar', id: 'charGenActionBar' });
      document.getElementById('actionBarSlot').appendChild(bar);
    } else {
      global.dom.clear(bar);
    }
    bar.style.display = '';
    bar.classList.toggle('is-collapsed', state.barCollapsed);

    if (state.barCollapsed) {
      // 收起态：底部右侧细竖胶囊，仅一个展开按钮
      const expandBtn = el('button', { class: 'gen-actionbar__tab', type: 'button', title: '展开操作' });
      expandBtn.insertAdjacentHTML('beforeend', global.icons.icon('chevron-up', 14));
      expandBtn.addEventListener('click', () => {
        state.barCollapsed = false;
        renderActionBar();
      });
      bar.appendChild(expandBtn);
      return;
    }

    // 展开态：两个主按钮 + 收起钮
    const btns = el('div', { class: 'gen-actionbar__btns' });
    const saveBtn = global.ui.Button({ variant: 'secondary', icon: 'save' }, '保存草稿');
    saveBtn.addEventListener('click', async () => {
      const record = {
        id: global.uid(),
        name: state.form.name || '(草稿)',
        groupId: state.form.group || null,
        formInput: global.deepClone(state.form),
        generatedResult: null,
        openingMessages: [],
        worldbookIds: state.form.worldbookIds,
        styleIds: state.form.styleIds,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await global.xvdb.put('charPersonas', record);
      global.toast.success('草稿已保存到档案库');
    });
    const genBtn = global.ui.Button({ variant: 'primary', icon: 'sparkle' }, '生成 char 人设（含 3 开场白）');
    genBtn.addEventListener('click', generate);
    btns.append(saveBtn, genBtn);
    bar.appendChild(btns);

    const collapseBtn = el('button', { class: 'gen-actionbar__collapse', type: 'button', title: '收起操作' });
    collapseBtn.insertAdjacentHTML('beforeend', global.icons.icon('chevron-down', 14));
    collapseBtn.addEventListener('click', () => {
      state.barCollapsed = true;
      renderActionBar();
    });
    bar.appendChild(collapseBtn);
  }

  async function generate() {
    const s = await global.xvdb.get('settings', 'global');
    if (!s?.activePresetId) { global.toast.error('请先在设置页选择 API 预设'); return; }
    const preset = await global.xvdb.get('apiPresets', s.activePresetId);
    if (!preset?.apiKey && preset.protocol !== 'custom') { global.toast.error('请先在设置页填写 API Key'); return; }
    if (!preset?.model) { global.toast.error('请先在设置页选择模型'); return; }

    const formData = global.deepClone(state.form);
    formData.boundUsers = state.users.filter((u) => u.id === state.form.boundUserId);
    formData.worldbookContents = state.worldbooks.filter((w) => state.form.worldbookIds.includes(w.id));
    formData.styleContents = state.styles.filter((st) => state.form.styleIds.includes(st.id));

    const messages = global.charPrompt.build(formData, { protocol: s.responseProtocol });

    global.loading.show({ text: 'AI 正在生成 char 人设（含 3 段开场白，可能需要 1-2 分钟）…' });
    try {
      const result = await global.api.chat(preset, messages);
      global.loading.update('解析返回…');

      // char 模式：解析时把开场白单独提取
      let parsed = global.responseParser.parse(result.text, s.responseProtocol, ['基础信息', '外貌特征', '人格特征', '职业生涯', '身世背景', '人际关系']);

      // 提取开场白
      let openingMessages = [];
      if (parsed.data) {
        if (Array.isArray(parsed.data['开场白'])) {
          openingMessages = parsed.data['开场白'];
        } else {
          // 自由文本模式：从 raw 提取 ## 开场白 1/2/3
          const raw = result.text;
          for (let i = 1; i <= 3; i++) {
            const re = new RegExp(`##\\s*开场白\\s*${i}[\\s\\S]*?(?=##\\s*开场白\\s*${i + 1}|$)`, 'i');
            const m = raw.match(re);
            if (m) openingMessages.push(m[0].replace(/##\s*开场白\s*\d+/i, '').trim());
          }
        }
      }

      const record = {
        id: global.uid(),
        name: state.form.name || '(未命名 char)',
        groupId: state.form.group || null,
        formInput: global.deepClone(state.form),
        generatedResult: parsed.data || { _raw: result.text },
        openingMessages,
        worldbookIds: state.form.worldbookIds,
        styleIds: state.form.styleIds,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await global.xvdb.put('charPersonas', record);
      global.loading.hide();
      if (parsed.ok) {
        global.toast.success(`生成成功，已存入档案库（含 ${openingMessages.length} 段开场白）`);
      } else {
        global.toast.warn('已生成但解析可能不完整：' + (parsed.error || ''));
      }
      setTimeout(() => global.router.navigate('/archive/char'), 800);
    } catch (e) {
      global.loading.hide();
      let msg = e.message || '生成失败';
      if (e.code === 'AUTH_FAILED') msg = 'API Key 错误或已失效';
      else if (e.code === 'RATE_LIMIT') msg = '请求过于频繁，请稍后再试';
      else if (e.code === 'NETWORK') msg = '网络错误，请检查 Base URL 或 CORS';
      global.toast.error(msg, 6000);
    }
  }

  global.pages = global.pages || {};
  global.pages['char-gen'] = { match: '/char-gen', mount, unmount };
  global.pages['char-gen/:panel'] = { match: '/char-gen/:panel', mount, unmount };
})(window);
