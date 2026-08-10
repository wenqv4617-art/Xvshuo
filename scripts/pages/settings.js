/* pages/settings.js — 设置页完整实现（API + 数据管理） */
(function (global) {
  const { el } = global.dom;
  let state = {
    presets: [],
    activeId: null,
    editingId: null,
    editingDraft: null,
    responseProtocol: 'json',
    tab: 'api'
  };

  async function loadAll() {
    state.presets = await global.xvdb.all('apiPresets');
    const s = await global.xvdb.get('settings', 'global');
    state.activeId = s?.activePresetId || (state.presets[0]?.id || null);
    state.responseProtocol = s?.responseProtocol || 'json';
    // 自动选中默认
    if (!state.editingId) {
      if (state.presets.length === 0) {
        state.editingId = '__new__';
        state.editingDraft = blankDraft();
      } else {
        state.editingId = state.activeId || state.presets[0].id;
        state.editingDraft = await global.xvdb.get('apiPresets', state.editingId);
      }
    }
    render();
  }

  function blankDraft() {
    return {
      id: global.uid(),
      name: '新预设',
      protocol: 'openai',
      baseUrl: 'https://api.openai.com',
      apiKey: '',
      model: '',
      models: [],
      temperature: 0.8,
      customTemplate: { requestTemplate: '', responsePath: '', headers: {}, method: 'POST', modelsEndpoint: '', modelsResponsePath: '' },
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  function render() {
    const root = document.getElementById('settingsMount');
    if (!root) return;
    global.dom.clear(root);

    // 分类切换走侧边栏（/settings/:tab），页面内不再保留 Tab 栏
    if (state.tab === 'api') renderApi(root);
    else renderData(root);
  }

  function renderApi(root) {
    const layout = el('div', { class: 'settings-layout' });

    // 左侧预设列表
    const listCol = el('div', { class: 'preset-list-col' });
    listCol.appendChild(el('div', { class: 'section-head' },
      el('div', { class: 'section-head__title' }, '预设'),
      el('div', { class: 'section-head__num' }, String(state.presets.length).padStart(2, '0'))
    ));
    const list = el('div', { class: 'preset-list' });
    for (const p of state.presets) {
      const item = el('div', { class: 'preset-list__item' + (p.id === state.editingId ? ' is-active' : '') });
      item.appendChild(el('div', { class: 'preset-list__name' }, p.name + (p.id === state.activeId ? ' ✓' : '')));
      item.appendChild(el('div', { class: 'preset-list__protocol' }, global.protocol.get(p.protocol).label));
      item.addEventListener('click', () => { state.editingId = p.id; state.editingDraft = p; render(); });
      list.appendChild(item);
    }
    listCol.appendChild(list);
    const addBtn = global.ui.Button({ variant: 'secondary', size: 'sm', block: true, icon: 'plus' }, '新建预设');
    addBtn.addEventListener('click', async () => {
      state.editingId = '__new__';
      state.editingDraft = blankDraft();
      render();
    });
    listCol.appendChild(addBtn);
    layout.appendChild(listCol);

    // 右侧详情表单
    const formCol = el('div');
    const draft = state.editingDraft;
    if (!draft) {
      formCol.appendChild(global.ui.EmptyState({ icon: 'settings', title: '未选择预设', hint: '点击左侧预设或新建' }));
      layout.appendChild(formCol);
      root.appendChild(layout);
      return;
    }

    const p = global.protocol.get(draft.protocol);

    // 协议选择
    const protoOptions = global.protocol.list().map((p) => ({ value: p.key, label: p.label }));
    const protoField = global.ui.Select({
      label: '协议类型',
      options: protoOptions,
      required: true
    });
    protoField.querySelector('select').value = draft.protocol;
    protoField.querySelector('select').addEventListener('change', (e) => {
      draft.protocol = e.target.value;
      const meta = global.protocol.get(draft.protocol);
      if (!draft.baseUrl || draft.baseUrl === '' || Object.values(global.protocol.PROTOCOLS).some((pp) => pp.defaultBaseUrl === draft.baseUrl)) {
        draft.baseUrl = meta.defaultBaseUrl;
      }
      // 预填官方默认模型（如 DeepSeek）
      if ((meta.defaultModels || []).length && (!draft.models || draft.models.length === 0)) {
        draft.models = meta.defaultModels.slice();
        draft.model = meta.defaultModels[0];
      }
      render();
    });
    formCol.appendChild(protoField);

    // 名称
    const nameField = global.ui.Input({ label: '预设名', value: draft.name, placeholder: '如 OpenAI 官方' });
    const nameInput = nameField.querySelector('input');
    nameInput.addEventListener('input', () => draft.name = nameInput.value);
    formCol.appendChild(nameField);

    // Base URL
    const urlField = global.ui.Input({ label: 'Base URL', value: draft.baseUrl, placeholder: 'https://api.openai.com' });
    const urlInput = urlField.querySelector('input');
    urlInput.addEventListener('input', () => draft.baseUrl = urlInput.value);
    formCol.appendChild(urlField);

    // API Key
    const keyWrap = el('div', { class: 'field' });
    keyWrap.appendChild(el('label', { class: 'field__label' }, 'API Key'));
    const keyRow = el('div', { class: 'input-group' });
    const keyInput = el('input', { class: 'input', type: 'password', value: draft.apiKey || '', placeholder: 'sk-...' });
    const eyeBtn = el('button', { class: 'icon-btn', type: 'button', html: global.icons.icon('eye', 16) });
    let shown = false;
    eyeBtn.addEventListener('click', () => {
      shown = !shown;
      keyInput.type = shown ? 'text' : 'password';
      eyeBtn.innerHTML = global.icons.icon(shown ? 'eye-off' : 'eye', 16);
    });
    keyInput.addEventListener('input', () => draft.apiKey = keyInput.value);
    keyRow.append(keyInput, eyeBtn);
    keyWrap.appendChild(keyRow);
    keyWrap.appendChild(el('div', { class: 'field__hint' }, '本地存储，不上传。'));
    formCol.appendChild(keyWrap);

    // 模型下拉 + 拉取
    const modelWrap = el('div', { class: 'field' });
    modelWrap.appendChild(el('label', { class: 'field__label' }, '模型'));
    const modelRow = el('div', { class: 'input-group' });
    const modelSel = el('select', { class: 'select' });
    const modelList = draft.models || [];
    if (modelList.length === 0) modelSel.appendChild(el('option', { value: '' }, '（请拉取模型）'));
    for (const m of modelList) modelSel.appendChild(el('option', { value: m }, m));
    if (draft.model) modelSel.value = draft.model;
    modelSel.addEventListener('change', () => draft.model = modelSel.value);
    const fetchBtn = global.ui.Button({ variant: 'secondary', size: 'sm', icon: 'refresh' }, '拉取');
    fetchBtn.addEventListener('click', async () => {
      fetchBtn.disabled = true;
      fetchBtn.querySelector('.btn__label').textContent = '拉取中…';
      try {
        const models = await global.api.listModels(draft);
        draft.models = models;
        if (!draft.model && models.length) draft.model = models[0];
        global.toast.success(`拉取成功 · ${models.length} 个模型`);
        render();
      } catch (e) {
        global.toast.error('拉取失败: ' + e.message);
      } finally {
        fetchBtn.disabled = false;
      }
    });
    modelRow.append(modelSel, fetchBtn);
    modelWrap.appendChild(modelRow);
    formCol.appendChild(modelWrap);

    // 温度
    const tempField = el('div', { class: 'field' });
    tempField.appendChild(el('label', { class: 'field__label' }, '温度 ' + (draft.temperature ?? 0.8).toFixed(2)));
    const tempSlider = el('input', { type: 'range', min: '0', max: '2', step: '0.05', value: String(draft.temperature ?? 0.8), style: 'width:100%;' });
    tempSlider.addEventListener('input', () => {
      draft.temperature = parseFloat(tempSlider.value);
      tempField.querySelector('.field__label').textContent = '温度 ' + draft.temperature.toFixed(2);
    });
    tempField.appendChild(tempSlider);
    formCol.appendChild(tempField);

    // 自定义模板（仅 custom 协议）
    if (draft.protocol === 'custom') {
      formCol.appendChild(global.ui.Divider({ strong: true }));
      formCol.appendChild(el('div', { class: 'section-head__title', style: 'margin-bottom:var(--space-3);' }, '自定义模板'));
      const tpl = draft.customTemplate || (draft.customTemplate = {});
      // 请求模板
      const reqTplField = global.ui.Textarea({
        label: '请求模板（Mustache 风格，占位符 {{messages}} {{model}} {{temperature}} {{system}} {{apiKey}}）',
        rows: 6,
        placeholder: '{"model":"{{model}}","messages":{{messages}},"temperature":{{temperature}}}'
      });
      reqTplField.querySelector('textarea').value = tpl.requestTemplate || '';
      reqTplField.querySelector('textarea').addEventListener('input', (e) => tpl.requestTemplate = e.target.value);
      formCol.appendChild(reqTplField);
      // 响应路径
      const rpField = global.ui.Input({ label: '响应路径（JSONPath）', value: tpl.responsePath || '', placeholder: 'choices[0].message.content' });
      rpField.querySelector('input').addEventListener('input', (e) => tpl.responsePath = e.target.value);
      formCol.appendChild(rpField);
      // 模型端点
      const meField = global.ui.Input({ label: '模型列表端点', value: tpl.modelsEndpoint || '', placeholder: '/v1/models' });
      meField.querySelector('input').addEventListener('input', (e) => tpl.modelsEndpoint = e.target.value);
      formCol.appendChild(meField);
    }

    // 操作按钮
    formCol.appendChild(global.ui.Divider({ strong: true }));
    const actionBar = el('div', { class: 'flex gap-3', style: 'flex-wrap:wrap;' });
    const saveBtn = global.ui.Button({ variant: 'primary', icon: 'save' }, state.editingId === '__new__' ? '保存为新预设' : '更新预设');
    saveBtn.addEventListener('click', async () => {
      draft.updatedAt = new Date().toISOString();
      if (state.editingId === '__new__') {
        draft.createdAt = new Date().toISOString();
        await global.xvdb.put('apiPresets', draft);
        state.editingId = draft.id;
        global.toast.success('已保存为新预设');
      } else {
        await global.xvdb.put('apiPresets', draft);
        global.toast.success('预设已更新');
      }
      await loadAll();
    });
    actionBar.appendChild(saveBtn);

    const applyGlobalBtn = global.ui.Button({ variant: 'secondary', icon: 'check' }, '应用到全局');
    applyGlobalBtn.addEventListener('click', async () => {
      if (state.editingId === '__new__') { global.toast.warn('请先保存预设'); return; }
      const s = await global.xvdb.get('settings', 'global');
      s.activePresetId = draft.id;
      s.updatedAt = new Date().toISOString();
      await global.xvdb.put('settings', s);
      global.toast.success('已应用到全局');
      await loadAll();
    });
    actionBar.appendChild(applyGlobalBtn);

    if (state.editingId !== '__new__') {
      const delBtn = global.ui.Button({ variant: 'danger', icon: 'trash' }, '删除');
      delBtn.addEventListener('click', async () => {
        const ok = await global.modal.confirm({
          title: '删除预设',
          message: `确定删除「${draft.name}」？此操作不可撤销。`,
          confirmText: '删除',
          danger: true
        });
        if (!ok) return;
        await global.xvdb.del('apiPresets', draft.id);
        const s = await global.xvdb.get('settings', 'global');
        if (s.activePresetId === draft.id) { s.activePresetId = null; await global.xvdb.put('settings', s); }
        state.editingId = null; state.editingDraft = null;
        global.toast.success('已删除');
        await loadAll();
      });
      actionBar.appendChild(delBtn);
    }

    formCol.appendChild(actionBar);

    // 全局：AI 返回格式协议
    formCol.appendChild(global.ui.Divider({}));
    formCol.appendChild(el('div', { class: 'section-head' },
      el('div', { class: 'section-head__title' }, 'AI 返回格式协议'),
      el('div', { class: 'section-head__hint' }, '生成时 AI 的输出格式')
    ));
    const protoTabs = global.tabs.make(
      [
        { key: 'json', label: '结构化 JSON' },
        { key: 'text', label: '自由文本' }
      ],
      state.responseProtocol,
      async (k) => {
        state.responseProtocol = k;
        const s = await global.xvdb.get('settings', 'global');
        s.responseProtocol = k;
        s.updatedAt = new Date().toISOString();
        await global.xvdb.put('settings', s);
        global.toast.success('已切换 AI 返回格式');
      }
    );
    formCol.appendChild(protoTabs.wrap);

    layout.appendChild(formCol);
    root.appendChild(layout);
  }

  function renderData(root) {
    const card = el('div', { class: 'card card--padded-lg' });
    card.appendChild(el('div', { class: 'card-header' },
      el('div', null,
        el('div', { class: 'card-header__title' }, '数据管理')
      )
    ));
    const actions = el('div', { class: 'flex gap-3', style: 'flex-wrap:wrap;margin-top:var(--space-4);' });

    const exportBtn = global.ui.Button({ variant: 'primary', icon: 'download' }, '导出全部数据 (.json)');
    exportBtn.addEventListener('click', async () => {
      const data = await global.xvdb.exportAll();
      const json = JSON.stringify(data, null, 2);
      global.fmt.download(`xvshuo-backup-${Date.now()}.json`, json, 'application/json');
      global.toast.success('已导出全部数据');
    });
    actions.appendChild(exportBtn);

    const importBtn = global.ui.Button({ variant: 'secondary', icon: 'upload' }, '导入数据');
    const fileInput = el('input', { type: 'file', accept: '.json,application/json', style: 'display:none;' });
    importBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async (e) => {
      const f = e.target.files[0];
      if (!f) return;
      try {
        const text = await global.fmt.readFile(f);
        const json = global.fmt.safeJSON(text, null);
        if (!json) throw new Error('文件格式无效');
        const ok = await global.modal.confirm({
          title: '导入数据',
          message: `将导入 ${Object.keys(json.data || {}).length} 张表的数据，会覆盖同名记录。继续？`,
          confirmText: '导入'
        });
        if (!ok) return;
        const n = await global.xvdb.importAll(json);
        global.toast.success(`已导入 ${n} 张表`);
        await loadAll();
      } catch (err) {
        global.toast.error('导入失败: ' + err.message);
      } finally {
        fileInput.value = '';
      }
    });
    actions.appendChild(importBtn);
    actions.appendChild(fileInput);

    card.appendChild(actions);
    card.appendChild(el('div', { class: 'field__hint', style: 'margin-top:var(--space-6);' },
      '所有数据存储在浏览器 IndexedDB 中。清除浏览器数据会丢失全部内容，建议定期导出备份。'
    ));

    root.appendChild(card);
  }

  function mount(params) {
    if (params && params.tab && ['api', 'data'].includes(params.tab)) state.tab = params.tab;
    loadAll();
  }
  function unmount() { state.editingDraft = null; }

  global.pages = global.pages || {};
  global.pages.settings = { match: '/settings', mount, unmount };
  global.pages['settings/:tab'] = { match: '/settings/:tab', mount, unmount };
})(window);
