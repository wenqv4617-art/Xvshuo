/* pages/side-story.js — 番外生成完整实现 */
(function (global) {
  const { el } = global.dom;
  let state = {
    inspiration: '',
    boundCharId: null,
    boundUserId: null,
    styleIds: [],
    chars: [],
    users: [],
    styles: [],
    lastPrompt: ''
  };

  async function load() {
    state.chars = await global.xvdb.all('charPersonas');
    state.users = await global.xvdb.all('userPersonas');
    state.styles = await global.xvdb.all('styles');
    render();
  }
  function mount() { load(); }
  function unmount() {}

  function render() {
    const root = document.getElementById('sideStoryMount');
    if (!root) return;
    global.dom.clear(root);

    // 灵感输入 + 扩写按钮（同卡）
    const inspCard = el('div', { class: 'card' });
    inspCard.appendChild(el('div', { class: 'card-header' },
      el('div', null,
        el('div', { class: 'card-header__title' }, '剧情灵感')
      )
    ));
    const inspField = global.ui.Textarea({
      rows: 6,
      value: state.inspiration,
      placeholder: '如：平行世界的 user 是 char 和朋友们养的底层代码写满 bug 的小猫咪…'
    });
    inspField.querySelector('textarea').addEventListener('input', (e) => state.inspiration = e.target.value);
    inspCard.appendChild(inspField);

    const genBtn = global.ui.Button({ variant: 'primary', size: 'lg', block: true, icon: 'sparkle' }, '扩写为番外提示词');
    genBtn.addEventListener('click', generate);
    inspCard.appendChild(el('div', { style: 'margin-top:var(--space-4);' }, genBtn));
    root.appendChild(inspCard);

    // 扩写结果
    if (state.lastPrompt) {
      const outCard = el('div', { class: 'card', style: 'margin-top:var(--space-6);' });
      outCard.appendChild(el('div', { class: 'card-header' },
        el('div', null,
          el('div', { class: 'card-header__title' }, '扩写结果')
        ),
        (() => {
          const row = el('div', { class: 'flex gap-2' });
          const copyBtn = global.ui.IconBtn({ icon: 'copy', label: '复制' });
          copyBtn.addEventListener('click', async () => {
            const ok = await global.xexport.copyText(state.lastPrompt);
            if (ok) global.toast.success('已复制'); else global.toast.error('复制失败');
          });
          row.appendChild(copyBtn);
          return row;
        })()
      ));
      const pre = el('pre', { class: 'prompt-result' });
      pre.textContent = state.lastPrompt;
      outCard.appendChild(pre);
      root.appendChild(outCard);
    }

    // 绑定 char/user/文风
    const bindCard = el('div', { class: 'card', style: 'margin-top:var(--space-6);' });
    bindCard.appendChild(el('div', { class: 'card-header' },
      el('div', null, el('div', { class: 'card-header__title' }, '人物设定参考'))
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
    const styleContents = state.styles.filter((s) => state.styleIds.includes(s.id));

    const messages = global.sideStoryPrompt.build(state.inspiration, boundChar, boundUser, styleContents);

    global.loading.show({ text: 'AI 正在扩写番外提示词…' });
    try {
      const result = await global.api.chat(preset, messages);
      global.loading.hide();

      // 保存到档案库 sideStories 表（content = 扩写后的提示词）
      const record = {
        id: global.uid(),
        name: state.inspiration.slice(0, 30) + '…',
        inspiration: state.inspiration,
        content: result.text,
        kind: 'prompt',
        boundCharId: state.boundCharId,
        boundUserId: state.boundUserId,
        styleIds: state.styleIds,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await global.xvdb.put('sideStories', record);
      state.lastPrompt = result.text;
      global.toast.success('扩写完成，已存入档案库');
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
  global.pages['side-story'] = { match: '/side-story', mount, unmount };
})(window);
