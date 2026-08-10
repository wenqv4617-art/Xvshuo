/* pages/html-snippet.js — HTML 产物生成完整实现 */
(function (global) {
  const { el } = global.dom;
  let state = {
    inspiration: '',
    boundCharId: null,
    boundUserId: null,
    worldbookIds: [],
    styleIds: [],
    chars: [],
    users: [],
    worldbooks: [],
    styles: [],
    lastHtml: ''
  };

  async function load() {
    state.chars = await global.xvdb.all('charPersonas');
    state.users = await global.xvdb.all('userPersonas');
    state.worldbooks = await global.xvdb.all('worldbooks');
    state.styles = await global.xvdb.all('styles');
    render();
  }
  function mount() { load(); }
  function unmount() {}

  function render() {
    const root = document.getElementById('htmlSnippetMount');
    if (!root) return;
    global.dom.clear(root);

    // 灵感输入 + 生成按钮（同卡）
    const inspCard = el('div', { class: 'card' });
    inspCard.appendChild(el('div', { class: 'card-header' },
      el('div', null,
        el('div', { class: 'card-header__title' }, 'HTML 产物灵感')
      )
    ));
    const inspField = global.ui.Textarea({
      rows: 6,
      value: state.inspiration,
      placeholder: '输入灵感…'
    });
    inspField.querySelector('textarea').addEventListener('input', (e) => state.inspiration = e.target.value);
    inspCard.appendChild(inspField);

    const genBtn = global.ui.Button({ variant: 'primary', size: 'lg', block: true, icon: 'sparkle' }, '生成指令头与 HTML 模板');
    genBtn.addEventListener('click', generate);
    inspCard.appendChild(el('div', { style: 'margin-top:var(--space-4);' }, genBtn));
    root.appendChild(inspCard);

    // 生成结果（指令头 + 模板）
    if (state.lastHtml) {
      const outCard = el('div', { class: 'card', style: 'margin-top:var(--space-6);' });
      outCard.appendChild(el('div', { class: 'card-header' },
        el('div', null,
          el('div', { class: 'card-header__title' }, '生成结果')
        ),
        (() => {
          const row = el('div', { class: 'flex gap-2' });
          const copyBtn = global.ui.IconBtn({ icon: 'copy', label: '复制' });
          copyBtn.addEventListener('click', async () => {
            const ok = await global.xexport.copyText(state.lastHtml);
            if (ok) global.toast.success('已复制'); else global.toast.error('复制失败');
          });
          row.appendChild(copyBtn);
          return row;
        })()
      ));
      const pre = el('pre', { class: 'prompt-result' });
      pre.textContent = state.lastHtml;
      outCard.appendChild(pre);
      root.appendChild(outCard);
    }

    // 绑定参考
    const bindCard = el('div', { class: 'card', style: 'margin-top:var(--space-6);' });
    bindCard.appendChild(el('div', { class: 'card-header' },
      el('div', null, el('div', { class: 'card-header__title' }, '参考设定'))
    ));

    const charField = el('div', { class: 'field' });
    charField.appendChild(el('label', { class: 'field__label' }, '绑定 char'));
    const charSel = el('select', { class: 'select' });
    charSel.appendChild(el('option', { value: '' }, '（不绑定）'));
    for (const c of state.chars) {
      const o = el('option', { value: c.id }, c.name || '(未命名)');
      if (state.boundCharId === c.id) o.selected = true;
      charSel.appendChild(o);
    }
    charSel.addEventListener('change', (e) => state.boundCharId = e.target.value || null);
    charField.appendChild(charSel);
    bindCard.appendChild(charField);

    const userField = el('div', { class: 'field', style: 'margin-top:var(--space-4);' });
    userField.appendChild(el('label', { class: 'field__label' }, '绑定 user'));
    const userSel = el('select', { class: 'select' });
    userSel.appendChild(el('option', { value: '' }, '（不绑定）'));
    for (const u of state.users) {
      const o = el('option', { value: u.id }, u.name || '(未命名)');
      if (state.boundUserId === u.id) o.selected = true;
      userSel.appendChild(o);
    }
    userSel.addEventListener('change', (e) => state.boundUserId = e.target.value || null);
    userField.appendChild(userSel);
    bindCard.appendChild(userField);

    // 世界书挂载
    if (state.worldbooks.length) {
      const wbWrap = el('div', { class: 'flex flex-col gap-2', style: 'margin-top:var(--space-4);' });
      wbWrap.appendChild(el('label', { class: 'field__label' }, '挂载世界书'));
      for (const w of state.worldbooks) {
        const selected = state.worldbookIds.includes(w.id);
        const chip = el('button', { class: 'chip' + (selected ? ' is-selected' : ''), type: 'button' }, w.name);
        chip.addEventListener('click', () => {
          if (selected) state.worldbookIds = state.worldbookIds.filter((id) => id !== w.id);
          else state.worldbookIds.push(w.id);
          render();
        });
        wbWrap.appendChild(chip);
      }
      bindCard.appendChild(wbWrap);
    }

    // 文风挂载
    if (state.styles.length) {
      const styleWrap = el('div', { class: 'flex flex-col gap-2', style: 'margin-top:var(--space-4);' });
      styleWrap.appendChild(el('label', { class: 'field__label' }, '挂载文风'));
      for (const s of state.styles) {
        const selected = state.styleIds.includes(s.id);
        const chip = el('button', { class: 'chip' + (selected ? ' is-selected' : ''), type: 'button' }, s.name);
        chip.addEventListener('click', () => {
          if (selected) state.styleIds = state.styleIds.filter((id) => id !== s.id);
          else state.styleIds.push(s.id);
          render();
        });
        styleWrap.appendChild(chip);
      }
      bindCard.appendChild(styleWrap);
    }
    root.appendChild(bindCard);

    // 上次生成结果预览
    if (state.lastHtml) {
      const previewCard = el('div', { class: 'card', style: 'margin-top:var(--space-8);' });
      previewCard.appendChild(el('div', { class: 'card-header' },
        el('div', null,
          el('div', { class: 'card-header__title' }, '生成结果预览')
        )
      ));
      const iframeWrap = el('div', { style: 'padding:0;overflow:hidden;border:1px solid var(--color-line-soft);border-radius:var(--radius-md);' });
      const iframe = el('iframe', {
        style: 'width:100%;height:480px;border:0;background:#fff;',
        sandbox: 'allow-scripts allow-same-origin'
      });
      iframeWrap.appendChild(iframe);
      previewCard.appendChild(iframeWrap);
      iframe.srcdoc = state.lastHtml;
      root.appendChild(previewCard);
    }
  }

  async function generate() {
    if (!state.inspiration.trim()) { global.toast.warn('请先描述灵感'); return; }
    const s = await global.xvdb.get('settings', 'global');
    if (!s?.activePresetId) { global.toast.error('请先选择 API 预设'); return; }
    const preset = await global.xvdb.get('apiPresets', s.activePresetId);
    if (!preset?.apiKey && preset.protocol !== 'custom') { global.toast.error('请先填写 API Key'); return; }
    if (!preset?.model) { global.toast.error('请先选择模型'); return; }

    const boundChar = state.chars.find((c) => c.id === state.boundCharId);
    const boundUser = state.users.find((u) => u.id === state.boundUserId);
    const worldbooks = state.worldbooks.filter((w) => state.worldbookIds.includes(w.id));
    const styleContents = state.styles.filter((s) => state.styleIds.includes(s.id));

    const messages = global.htmlPrompt.build(state.inspiration, boundChar, boundUser, worldbooks, styleContents);

    global.loading.show({ text: 'AI 正在生成指令头与 HTML 模板…' });
    try {
      const result = await global.api.chat(preset, messages);
      global.loading.hide();

      state.lastHtml = result.text;

      // 保存到档案库 htmlSnippets 表（html = 指令头 + 模板）
      const record = {
        id: global.uid(),
        name: state.inspiration.slice(0, 30) + '…',
        inspiration: state.inspiration,
        html: result.text,
        kind: 'template',
        boundCharId: state.boundCharId,
        boundUserId: state.boundUserId,
        worldbookIds: state.worldbookIds,
        styleIds: state.styleIds,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await global.xvdb.put('htmlSnippets', record);
      global.toast.success('已生成并存入档案库');
      render();
    } catch (e) {
      global.loading.hide();
      let msg = e.message || '生成失败';
      if (e.code === 'AUTH_FAILED') msg = 'API Key 错误';
      else if (e.code === 'RATE_LIMIT') msg = '请求频繁';
      else if (e.code === 'NETWORK') msg = '网络错误，检查 CORS';
      global.toast.error(msg, 6000);
    }
  }

  global.pages = global.pages || {};
  global.pages['html-snippet'] = { match: '/html-snippet', mount, unmount };
})(window);
