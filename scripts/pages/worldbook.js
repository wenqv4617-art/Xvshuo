/* pages/worldbook.js — 世界书生成完整实现 */
(function (global) {
  const { el } = global.dom;
  let state = {
    form: {
      name: '',
      boundUserIds: [],
      boundCharIds: [],
      historyTags: [],
      historyCustom: '',
      speechTags: [],
      speechCustom: '',
      styleIds: []
    },
    users: [],
    chars: [],
    styles: []
  };

  async function load() {
    state.users = await global.xvdb.all('userPersonas');
    state.chars = await global.xvdb.all('charPersonas');
    state.styles = await global.xvdb.all('styles');
    render();
  }

  function mount() { load(); }
  function unmount() {}

  function render() {
    const root = document.getElementById('worldbookMount');
    if (!root) return;
    global.dom.clear(root);

    // 名称
    const nameField = global.ui.Input({ label: '世界书名称', value: state.form.name, placeholder: '如：琉璃王朝' });
    nameField.querySelector('input').addEventListener('input', (e) => state.form.name = e.target.value);
    root.appendChild(nameField);

    // 挂载 user
    root.appendChild(panelSection('01', '挂载 user', null, renderMultiPicker('users', 'boundUserIds', 'user')));
    // 挂载 char
    root.appendChild(panelSection('02', '挂载 char', null, renderMultiPicker('chars', 'boundCharIds', 'char')));

    // 历史背景
    root.appendChild(panelSection('03', '历史背景标签', null, renderTagPicker('history', 'historyTags', global.TAGS_HISTORY || [])));
    root.appendChild(panelSection('04', '历史背景补充', null, renderTextField('historyCustom', '额外描述这个世界的历史…')));

    // 人物语言风格
    root.appendChild(panelSection('05', '人物语言风格标签', null, renderTagPicker('speech', 'speechTags', global.TAGS_SPEECH || [])));
    root.appendChild(panelSection('06', '语言风格补充', null, renderTextField('speechCustom', '额外的语言风格说明…')));

    // 挂载文风
    root.appendChild(panelSection('07', '挂载文风', null, renderStylePicker()));

    // 生成按钮
    const genBtn = global.ui.Button({ variant: 'primary', size: 'lg', block: true, icon: 'sparkle' }, '生成世界书');
    genBtn.addEventListener('click', generate);
    root.appendChild(el('div', { style: 'margin-top:var(--space-8);' }, genBtn));
  }

  function panelSection(num, name, desc, body) {
    const sec = el('div', { class: 'gen-panel', style: 'margin-top:var(--space-6);' });
    const head = el('div', { class: 'gen-panel__head' });
    const title = el('div', { class: 'gen-panel__title' });
    title.appendChild(el('span', { class: 'gen-panel__num' }, num));
    title.appendChild(el('div', { class: 'gen-panel__name' }, name));
    head.appendChild(title);
    if (desc) head.appendChild(el('div', { class: 'gen-panel__desc' }, desc));
    sec.appendChild(head);
    sec.appendChild(body);
    return sec;
  }

  function renderMultiPicker(table, stateKey, label) {
    const wrap = el('div', { class: 'flex flex-col gap-3' });
    const items = state[table] || [];
    if (!items.length) {
      wrap.appendChild(global.ui.EmptyState({ icon: label === 'user' ? 'user' : 'char', title: `暂无${label}`, hint: `请先创建${label}` }));
      return wrap;
    }
    // 按分组归类
    const byGroup = {};
    for (const it of items) {
      const g = it.groupId || '默认分组';
      (byGroup[g] = byGroup[g] || []).push(it);
    }
    // 手风琴
    for (const [groupName, groupItems] of Object.entries(byGroup)) {
      const accItem = global.accordion.Item({
        num: '·',
        title: groupName + ' (' + groupItems.length + ')',
        open: false
      });
      const inner = el('div', { class: 'taglib-tags' });
      for (const it of groupItems) {
        const selected = state.form[stateKey].includes(it.id);
        const chip = el('button', { class: 'chip' + (selected ? ' is-selected' : ''), type: 'button' }, it.name || '(未命名)');
        chip.addEventListener('click', () => {
          if (selected) {
            state.form[stateKey] = state.form[stateKey].filter((id) => id !== it.id);
          } else {
            state.form[stateKey].push(it.id);
          }
          render();
        });
        inner.appendChild(chip);
      }
      accItem.item.querySelector('.accordion-inner').appendChild(inner);
      wrap.appendChild(accItem.item);
    }
    return wrap;
  }

  function renderTagPicker(prefix, stateKey, categories) {
    const wrap = el('div', { class: 'flex flex-col gap-4' });
    const sel = new Set(state.form[stateKey]);
    const tagLib = global.taglib.make({
      categories,
      selected: sel,
      onChange: (newSel) => { state.form[stateKey] = Array.from(newSel); },
      allowAdd: true,
      onAdd: async (catKey, value) => {
        await global.xvdb.put('customTags', {
          id: global.uid(),
          category: prefix + '-' + catKey,
          gender: 'all',
          value,
          createdAt: new Date().toISOString()
        });
        const cat = categories.find((c) => c.key === catKey);
        if (cat) cat.tags.push(value);
        render();
      }
    });
    wrap.appendChild(tagLib.root);
    return wrap;
  }

  function renderTextField(field, placeholder) {
    const f = global.ui.Textarea({ value: state.form[field], rows: 4, placeholder });
    f.querySelector('textarea').addEventListener('input', (e) => state.form[field] = e.target.value);
    return f;
  }

  function renderStylePicker() {
    const wrap = el('div', { class: 'flex flex-col gap-3' });
    if (!state.styles.length) {
      wrap.appendChild(global.ui.EmptyState({ icon: 'style', title: '暂无文风', hint: '请先创建文风' }));
      return wrap;
    }
    for (const s of state.styles) {
      const selected = state.form.styleIds.includes(s.id);
      const chip = el('button', { class: 'chip' + (selected ? ' is-selected' : ''), type: 'button' }, s.name);
      chip.addEventListener('click', () => {
        if (selected) {
          state.form.styleIds = state.form.styleIds.filter((id) => id !== s.id);
        } else {
          state.form.styleIds.push(s.id);
        }
        render();
      });
      wrap.appendChild(chip);
    }
    return wrap;
  }

  async function generate() {
    const s = await global.xvdb.get('settings', 'global');
    if (!s?.activePresetId) { global.toast.error('请先在设置页选择 API 预设'); return; }
    const preset = await global.xvdb.get('apiPresets', s.activePresetId);
    if (!preset?.apiKey && preset.protocol !== 'custom') { global.toast.error('请先填写 API Key'); return; }
    if (!preset?.model) { global.toast.error('请先选择模型'); return; }
    if (!state.form.name) { global.toast.warn('请填写世界书名称'); return; }

    const formData = global.deepClone(state.form);
    formData.boundUsers = state.users.filter((u) => state.form.boundUserIds.includes(u.id));
    formData.boundChars = state.chars.filter((c) => state.form.boundCharIds.includes(c.id));
    formData.styleContents = state.styles.filter((st) => state.form.styleIds.includes(st.id));

    const messages = global.worldbookPrompt.build(formData, { protocol: s.responseProtocol });

    global.loading.show({ text: 'AI 正在生成世界书…' });
    try {
      const result = await global.api.chat(preset, messages);
      global.loading.update('解析返回…');
      let parsed = global.responseParser.parse(result.text, s.responseProtocol, ['世界设定', '历史脉络', '地理环境', '社会结构', '文化信仰', '重要势力', '关键事件', '人物群像']);

      const record = {
        id: global.uid(),
        name: state.form.name,
        boundUserIds: state.form.boundUserIds,
        boundCharIds: state.form.boundCharIds,
        historyTags: state.form.historyTags,
        historyCustom: state.form.historyCustom,
        speechTags: state.form.speechTags,
        speechCustom: state.form.speechCustom,
        styleIds: state.form.styleIds,
        generatedResult: parsed.data || { _raw: result.text },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await global.xvdb.put('worldbooks', record);
      global.loading.hide();
      if (parsed.ok) global.toast.success('生成成功，已存入档案库');
      else global.toast.warn('已生成但解析可能不完整：' + (parsed.error || ''));
      setTimeout(() => global.router.navigate('/archive'), 800);
    } catch (e) {
      global.loading.hide();
      let msg = e.message || '生成失败';
      if (e.code === 'AUTH_FAILED') msg = 'API Key 错误或已失效';
      else if (e.code === 'RATE_LIMIT') msg = '请求过于频繁';
      else if (e.code === 'NETWORK') msg = '网络错误，请检查 Base URL 或 CORS';
      global.toast.error(msg, 6000);
    }
  }

  global.pages = global.pages || {};
  global.pages.worldbook = { match: '/worldbook', mount, unmount };
})(window);
