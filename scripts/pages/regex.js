/* pages/regex.js — 正则工具（AI 生成 + 沙箱实时预览） */
(function (global) {
  const { el } = global.dom;
  let state = {
    inspiration: '',
    patterns: [],   // [{find, replace, flags, enabled, description}]
    testInput: ''
  };

  async function load() {
    render();
  }
  function mount() { load(); }
  function unmount() {}

  function render() {
    const root = document.getElementById('regexMount');
    if (!root) return;
    global.dom.clear(root);

    // 顶部：灵感输入 + 生成
    const genCard = el('div', { class: 'card' });
    genCard.appendChild(el('div', { class: 'card-header' },
      el('div', null,
        el('div', { class: 'card-header__title' }, 'AI 生成正则')
      )
    ));
    const inspField = global.ui.Textarea({
      label: '灵感描述',
      rows: 3,
      value: state.inspiration,
      placeholder: '如：把所有"猫"替换为"喵"，把"狗"替换为"汪"，并去掉所有感叹号'
    });
    inspField.querySelector('textarea').addEventListener('input', (e) => state.inspiration = e.target.value);
    genCard.appendChild(inspField);

    const genBtn = global.ui.Button({ variant: 'primary', icon: 'sparkle' }, 'AI 生成正则');
    genBtn.addEventListener('click', generate);
    genCard.appendChild(el('div', { style: 'margin-top:var(--space-4);' }, genBtn));
    root.appendChild(genCard);

    // 已生成的步骤
    if (state.patterns.length) {
      const stepsCard = el('div', { class: 'card', style: 'margin-top:var(--space-6);' });
      stepsCard.appendChild(el('div', { class: 'card-header' },
        el('div', null,
          el('div', { class: 'card-header__title' }, '替换步骤 (' + state.patterns.length + ')')
        )
      ));
      const stepsList = el('div', { class: 'sandbox-steps' });
      state.patterns.forEach((p, i) => {
        const step = el('div', { class: 'sandbox-step' });
        step.appendChild(el('span', { class: 'sandbox-step__num' }, String(i + 1) + '.'));
        const enabled = el('input', { type: 'checkbox' });
        enabled.checked = p.enabled !== false;
        enabled.addEventListener('change', () => { p.enabled = enabled.checked; renderPreview(); });
        const findIn = el('input', { class: 'input', style: 'flex:1;font-family:var(--font-mono);', value: p.find || '' });
        findIn.addEventListener('input', (e) => { p.find = e.target.value; renderPreview(); });
        const repIn = el('input', { class: 'input', style: 'flex:1;font-family:var(--font-mono);', value: p.replace || '' });
        repIn.addEventListener('input', (e) => { p.replace = e.target.value; renderPreview(); });
        const flagsIn = el('input', { class: 'input', style: 'width:60px;font-family:var(--font-mono);', value: p.flags || 'g' });
        flagsIn.addEventListener('input', (e) => { p.flags = e.target.value; renderPreview(); });
        const delBtn = global.ui.IconBtn({ icon: 'trash', danger: true, label: '删除' });
        delBtn.addEventListener('click', () => { state.patterns.splice(i, 1); render(); });
        step.append(enabled, findIn, repIn, flagsIn, delBtn);
        stepsList.appendChild(step);
      });
      stepsCard.appendChild(stepsList);

      // 保存按钮
      const saveRow = el('div', { class: 'flex gap-3', style: 'margin-top:var(--space-4);' });
      const saveBtn = global.ui.Button({ variant: 'secondary', icon: 'save' }, '保存为规则');
      saveBtn.addEventListener('click', saveRule);
      saveRow.appendChild(saveBtn);
      stepsCard.appendChild(saveRow);

      root.appendChild(stepsCard);

      // 沙箱预览
      const sandboxCard = el('div', { class: 'card', style: 'margin-top:var(--space-6);' });
      sandboxCard.appendChild(el('div', { class: 'card-header' },
        el('div', null,
          el('div', { class: 'card-header__title' }, '沙箱预览')
        )
      ));
      const sandbox = el('div', { class: 'sandbox' });
      const leftPane = el('div', { class: 'sandbox-pane' });
      leftPane.appendChild(el('div', { class: 'sandbox-pane__label' }, '输入文本'));
      const testIn = el('textarea', { class: 'textarea', style: 'min-height:160px;', placeholder: '输入测试文本…' });
      testIn.value = state.testInput;
      testIn.addEventListener('input', () => { state.testInput = testIn.value; renderPreview(); });
      leftPane.appendChild(testIn);
      sandbox.appendChild(leftPane);

      const rightPane = el('div', { class: 'sandbox-pane' });
      rightPane.appendChild(el('div', { class: 'sandbox-pane__label' }, '替换结果'));
      const output = el('div', { class: 'sandbox-pane__output', id: 'regexOutput' }, '(在左侧输入文本，结果会实时显示在这里)');
      rightPane.appendChild(output);
      sandbox.appendChild(rightPane);
      sandboxCard.appendChild(sandbox);
      root.appendChild(sandboxCard);
    }
  }

  function renderPreview() {
    const out = document.getElementById('regexOutput');
    if (!out) return;
    if (!state.testInput) { out.textContent = '(在左侧输入文本，结果会实时显示在这里)'; return; }
    let text = state.testInput;
    const steps = state.patterns.filter((p) => p.enabled !== false);
    for (const p of steps) {
      try {
        const re = new RegExp(p.find || '', p.flags || 'g');
        text = text.replace(re, p.replace || '');
      } catch (e) {
        out.innerHTML = `<span style="color:var(--color-danger);">第 ${state.patterns.indexOf(p) + 1} 步正则错误: ${e.message}</span>`;
        return;
      }
    }
    out.textContent = text;
  }

  async function generate() {
    if (!state.inspiration.trim()) { global.toast.warn('请先描述灵感'); return; }
    const s = await global.xvdb.get('settings', 'global');
    if (!s?.activePresetId) { global.toast.error('请先在设置页选择 API 预设'); return; }
    const preset = await global.xvdb.get('apiPresets', s.activePresetId);
    if (!preset?.apiKey && preset.protocol !== 'custom') { global.toast.error('请先填写 API Key'); return; }
    if (!preset?.model) { global.toast.error('请先选择模型'); return; }

    const messages = global.regexPrompt.build(state.inspiration);
    global.loading.show({ text: 'AI 生成正则规则…' });
    try {
      const result = await global.api.chat(preset, messages);
      global.loading.hide();
      // 解析 JSON 数组
      let arr = null;
      try {
        const cleaned = result.text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
        const m = cleaned.match(/\[[\s\S]*\]/);
        arr = JSON.parse(m ? m[0] : cleaned);
      } catch {}
      if (!Array.isArray(arr)) {
        global.toast.error('AI 返回格式不正确，请重试');
        return;
      }
      state.patterns = arr.map((p) => ({
        find: p.find || '',
        replace: p.replace || '',
        flags: p.flags || 'g',
        enabled: true,
        description: p.description || ''
      }));
      global.toast.success(`已生成 ${state.patterns.length} 步正则`);
      render();
    } catch (e) {
      global.loading.hide();
      global.toast.error('生成失败: ' + e.message);
    }
  }

  async function saveRule() {
    const name = await global.modal.prompt({ title: '保存规则', label: '规则名', placeholder: '如：猫狗替换' });
    if (!name) return;
    const record = {
      id: global.uid(),
      name,
      description: state.inspiration,
      patterns: global.deepClone(state.patterns),
      testCases: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await global.xvdb.put('regexRules', record);
    global.toast.success('已保存');
    load();
  }

  global.pages = global.pages || {};
  global.pages.regex = { match: '/regex', mount, unmount };
})(window);
