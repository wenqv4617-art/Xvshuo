/* pages/user-gen.js — user 人设生成页（每页一个板块，侧边栏切换） */
(function (global) {
  const { el } = global.dom;
  let state = {
    form: {
      name: '', gender: '女', age: '', group: '',
      boundCharId: null, boundCharName: '', boundCharBrief: '',
      relation: '',
      appearanceTags: { hair: [], face: [], clothing: [] },
      personalityTags: [],
      worldbookIds: [], styleIds: [],
      worldBackgroundTags: [], plotDirectionTags: [], relationshipsTags: [], careerTags: [],
      extraInfo: ''
    },
    activeCat: 'hair',
    chars: [],
    worldbooks: [],
    styles: [],
    customTags: [],
    currentPanel: '01',
    barCollapsed: false
  };

  const GENDER_MAP = { '男': 'male', '女': 'female', '不限': 'all' };

  const PANELS = [
    { num: '01', name: '绑定 char' },
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
    state.chars = await global.xvdb.all('charPersonas');
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
    // 离开 user 生成页时自动隐藏底部操作栏
    const bar = document.getElementById('userGenActionBar');
    if (bar) bar.style.display = 'none';
  }

  function panelIndex() {
    const i = PANELS.findIndex((p) => p.num === state.currentPanel);
    return i < 0 ? 0 : i;
  }

  function render() {
    const root = document.getElementById('userGenMount');
    if (!root) return;
    global.dom.clear(root);

    // 当前板块标题条（手机端抽屉收起时也能看到位置）
    const cur = PANELS[panelIndex()];
    const headBar = el('div', { class: 'gen-panel-headbar' });
    headBar.appendChild(el('span', { class: 'gen-panel-headbar__num' }, cur.num));
    headBar.appendChild(el('span', { class: 'gen-panel-headbar__name' }, cur.name));
    // 上/下板块切换
    const navBtns = el('div', { class: 'flex gap-2' });
    if (panelIndex() > 0) {
      const prevBtn = global.ui.IconBtn({ icon: 'chevron-left', label: '上一板块' });
      prevBtn.addEventListener('click', () => global.router.navigate('/user-gen/' + PANELS[panelIndex() - 1].num));
      navBtns.appendChild(prevBtn);
    }
    if (panelIndex() < PANELS.length - 1) {
      const nextBtn = global.ui.IconBtn({ icon: 'chevron-right', label: '下一板块' });
      nextBtn.addEventListener('click', () => global.router.navigate('/user-gen/' + PANELS[panelIndex() + 1].num));
      navBtns.appendChild(nextBtn);
    }
    headBar.appendChild(navBtns);
    root.appendChild(headBar);

    // 只渲染当前板块
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

  // 通用标签多选面板（含自定义标签删除）
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
        await global.xvdb.delWhereFn('customTags', (t) => t.category === catPrefix + '-' + catKey && t.value === value);
        state.customTags = state.customTags.filter((t) => !(t.category === catPrefix + '-' + catKey && t.value === value));
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
    // 关系标签
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

    // 绑定 char
    const charField = el('div', { class: 'field' });
    charField.appendChild(el('label', { class: 'field__label' }, '绑定 char'));
    const charRow = el('div', { class: 'input-group' });
    const charDisp = el('input', { class: 'input', readonly: true, value: state.form.boundCharName || '', placeholder: '点击右侧选择 char…' });
    const pickBtn = global.ui.Button({ variant: 'secondary', icon: 'link' }, '选择');
    pickBtn.addEventListener('click', () => openCharPicker());
    const clearBtn = global.ui.Button({ variant: 'ghost', icon: 'close' }, '清除');
    clearBtn.addEventListener('click', () => {
      state.form.boundCharId = null;
      state.form.boundCharName = '';
      state.form.boundCharBrief = '';
      render();
    });
    charRow.append(charDisp, pickBtn, clearBtn);
    charField.appendChild(charRow);
    if (state.form.boundCharName) {
      charField.appendChild(el('div', { class: 'field__hint' }, '已绑定：' + state.form.boundCharName));
    }
    wrap.appendChild(charField);
    return wrap;
  }

  function openCharPicker() {
    const body = el('div', { class: 'flex flex-col gap-2' });
    if (!state.chars.length) {
      body.appendChild(global.ui.EmptyState({ icon: 'char', title: '暂无 char', hint: '请先在 char 人设入口创建' }));
    } else {
      for (const c of state.chars) {
        const item = el('div', { class: 'archive-card', style: 'cursor:pointer;' });
        item.appendChild(el('div', { class: 'archive-card__title' }, c.name || '(未命名)'));
        item.appendChild(el('div', { class: 'archive-card__meta' }, global.fmt.fmtRelative(c.updatedAt || c.createdAt)));
        item.addEventListener('click', () => {
          state.form.boundCharId = c.id;
          state.form.boundCharName = c.name;
          state.form.boundCharBrief = c.generatedResult ? JSON.stringify(c.generatedResult).slice(0, 300) : '';
          m.close();
          render();
        });
        body.appendChild(item);
      }
    }
    const m = global.modal.open({ title: '选择 char', body, size: 'wide' });
  }

  function renderPanel2() {
    const grid = el('div', { class: 'form-grid' });
    // 姓名
    const nameField = global.ui.Input({ label: '姓名', value: state.form.name, placeholder: '如：林月' });
    nameField.querySelector('input').addEventListener('input', (e) => state.form.name = e.target.value);
    grid.appendChild(nameField);
    // 性别
    const genderField = el('div', { class: 'field' });
    genderField.appendChild(el('label', { class: 'field__label' }, '性别'));
    const genderSel = el('select', { class: 'select' });
    ['男', '女', '不限'].forEach((g) => {
      const o = el('option', { value: g }, g);
      if (state.form.gender === g) o.selected = true;
      genderSel.appendChild(o);
    });
    genderSel.addEventListener('change', (e) => {
      state.form.gender = e.target.value;
      render();
    });
    genderField.appendChild(genderSel);
    grid.appendChild(genderField);
    // 年龄
    const ageField = global.ui.Input({ label: '年龄', value: state.form.age, placeholder: '如：24 或 不详' });
    ageField.querySelector('input').addEventListener('input', (e) => state.form.age = e.target.value);
    grid.appendChild(ageField);
    // 分组
    const groupField = global.ui.Input({ label: '分组', value: state.form.group, placeholder: '档案库分组依据' });
    groupField.querySelector('input').addEventListener('input', (e) => state.form.group = e.target.value);
    grid.appendChild(groupField);
    return grid;
  }

  function renderPanel3() {
    const wrap = el('div', { class: 'flex flex-col gap-4' });
    // 大类 Tab：发型 / 面部 / 穿衣（性别取自基础信息）
    const catTabs = global.tabs.make(
      [
        { key: 'hair', label: '发型' },
        { key: 'face', label: '面部锚点' },
        { key: 'clothing', label: '穿衣风格' }
      ],
      state.activeCat,
      (k) => { state.activeCat = k; render(); }
    );
    wrap.appendChild(catTabs.wrap);

    // 取当前类别的标签（性别直接取基础信息的 form.gender）
    const cat = state.activeCat;
    const genderKey = GENDER_MAP[state.form.gender] === 'all' ? null : GENDER_MAP[state.form.gender];
    const data = global.TAGS_APPEARANCE?.[cat];
    if (!data) return wrap;

    // 合并 female + male（all 模式）
    let categories = [];
    if (genderKey === null) {
      const f = data.female || [];
      const m = data.male || [];
      categories = [...f.map((c) => ({ ...c, label: c.label + '（女）' })), ...m.map((c) => ({ ...c, label: c.label + '（男）' }))];
    } else {
      categories = data[genderKey] || [];
    }
    if (!categories.length) {
      wrap.appendChild(el('div', { class: 'text-muted' }, '无标签'));
      return wrap;
    }

    // 选中集合
    const sel = state.form.appearanceTags[cat] || (state.form.appearanceTags[cat] = []);
    const removable = new Set(customTagsOf(cat + '-'));

    const tagLib = global.taglib.make({
      categories,
      selected: new Set(sel),
      removable,
      onChange: (newSel) => {
        state.form.appearanceTags[cat] = Array.from(newSel);
      },
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
        const cat2 = categories.find((c) => c.key === catKey);
        if (cat2) cat2.tags.push(value);
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
      onChange: (newSel) => {
        state.form.personalityTags = Array.from(newSel);
      },
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
    const f = global.ui.Textarea({ label: null, value: state.form[field], rows: 5, placeholder });
    f.querySelector('textarea').addEventListener('input', (e) => state.form[field] = e.target.value);
    return f;
  }

  function renderActionBar() {
    let bar = document.getElementById('userGenActionBar');
    if (!bar) {
      bar = el('div', { class: 'gen-actionbar', id: 'userGenActionBar' });
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
        boundCharId: state.form.boundCharId,
        relation: state.form.relation,
        formInput: global.deepClone(state.form),
        generatedResult: null,
        worldbookIds: state.form.worldbookIds,
        styleIds: state.form.styleIds,
        extraInfo: state.form.extraInfo,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await global.xvdb.put('userPersonas', record);
      global.toast.success('草稿已保存到档案库');
    });
    const genBtn = global.ui.Button({ variant: 'primary', icon: 'sparkle' }, '生成 user 人设');
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
    // 校验
    const s = await global.xvdb.get('settings', 'global');
    if (!s?.activePresetId) {
      global.toast.error('请先在设置页选择 API 预设');
      return;
    }
    const preset = await global.xvdb.get('apiPresets', s.activePresetId);
    if (!preset?.apiKey && preset.protocol !== 'custom') {
      global.toast.error('请先在设置页填写 API Key');
      return;
    }
    if (!preset?.model) {
      global.toast.error('请先在设置页选择模型');
      return;
    }

    // 组装 formData
    const formData = global.deepClone(state.form);
    // 填入挂载的世界书内容
    formData.worldbookContents = state.worldbooks.filter((w) => state.form.worldbookIds.includes(w.id));
    formData.styleContents = state.styles.filter((s) => state.form.styleIds.includes(s.id));

    // 构建 prompt
    const messages = global.userPrompt.build(formData, { protocol: s.responseProtocol });

    global.loading.show({ text: 'AI 正在生成 user 人设…' });
    try {
      const result = await global.api.chat(preset, messages);
      global.loading.update('解析返回…');
      let parsed = global.responseParser.parse(result.text, s.responseProtocol, ['基础信息', '外貌特征', '人格特征', '职业生涯', '身世背景', '人际关系']);

      const record = {
        id: global.uid(),
        name: state.form.name || '(未命名 user)',
        groupId: state.form.group || null,
        boundCharId: state.form.boundCharId,
        relation: state.form.relation,
        formInput: global.deepClone(state.form),
        generatedResult: parsed.data || { _raw: result.text },
        worldbookIds: state.form.worldbookIds,
        styleIds: state.form.styleIds,
        extraInfo: state.form.extraInfo,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await global.xvdb.put('userPersonas', record);
      global.loading.hide();
      if (parsed.ok) {
        global.toast.success('生成成功，已存入档案库');
      } else {
        global.toast.warn('已生成但解析可能不完整：' + (parsed.error || ''));
      }
      // 跳到档案库
      setTimeout(() => global.router.navigate('/archive/user'), 800);
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
  global.pages['user-gen'] = { match: '/user-gen', mount, unmount };
  global.pages['user-gen/:panel'] = { match: '/user-gen/:panel', mount, unmount };
})(window);
