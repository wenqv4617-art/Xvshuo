/* pages/style.js — 文风 CRUD 完整实现 */
(function (global) {
  const { el } = global.dom;
  let state = { items: [] };

  async function load() {
    state.items = await global.xvdb.all('styles');
    render();
  }

  function mount() { load(); }
  function unmount() {}

  function render() {
    const root = document.getElementById('styleMount');
    if (!root) return;
    global.dom.clear(root);

    // 顶部操作栏
    const head = el('div', { class: 'section-head' });
    head.appendChild(el('div', { class: 'section-head__title' }, '文风列表'));
    head.appendChild(el('div', { class: 'section-head__num' }, String(state.items.length).padStart(2, '0')));
    root.appendChild(head);

    const newBtn = global.ui.Button({ variant: 'primary', icon: 'plus' }, '新建文风');
    newBtn.addEventListener('click', () => openEditor(null));
    root.appendChild(el('div', { style: 'margin-bottom:var(--space-6);' }, newBtn));

    // 列表
    if (!state.items.length) {
      root.appendChild(global.ui.EmptyState({
        icon: 'style',
        title: '暂无文风',
        hint: '新建一个文风预设，对 AI 输出风格施加最高约束'
      }));
      return;
    }
    const list = el('div', { class: 'style-list' });
    for (const s of state.items) {
      list.appendChild(renderItem(s));
    }
    root.appendChild(list);
  }

  function renderItem(s) {
    const item = el('div', { class: 'style-item' });
    const head = el('div', { class: 'style-item__head' });
    head.appendChild(el('div', { class: 'style-item__title' }, s.name));
    const actions = el('div', { class: 'flex gap-2' });
    const editBtn = global.ui.IconBtn({ icon: 'edit', label: '编辑' });
    editBtn.addEventListener('click', () => openEditor(s));
    const delBtn = global.ui.IconBtn({ icon: 'trash', danger: true, label: '删除' });
    delBtn.addEventListener('click', async () => {
      const ok = await global.modal.confirm({
        title: '删除文风',
        message: `确定删除「${s.name}」？`,
        confirmText: '删除', danger: true
      });
      if (!ok) return;
      await global.xvdb.del('styles', s.id);
      global.toast.success('已删除');
      load();
    });
    actions.append(editBtn, delBtn);
    head.appendChild(actions);
    item.appendChild(head);
    if (s.description) item.appendChild(el('div', { class: 'style-item__desc' }, s.description));
    if (s.content) item.appendChild(el('div', { class: 'text-muted', style: 'font-size:var(--fs-xs);margin-top:var(--space-2);' }, global.fmt.truncate(s.content, 120)));
    return item;
  }

  function openEditor(s) {
    const isNew = !s;
    const draft = s ? global.deepClone(s) : {
      id: global.uid(),
      name: '',
      description: '',
      content: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const body = el('div', { class: 'flex flex-col gap-4' });
    const nameField = global.ui.Input({ label: '名称', value: draft.name, placeholder: '如：清冷散文体' });
    const nameInput = nameField.querySelector('input');
    body.appendChild(nameField);

    const descField = global.ui.Input({ label: '简短描述', value: draft.description, placeholder: '一行说明' });
    const descInput = descField.querySelector('input');
    body.appendChild(descField);

    const contentField = global.ui.Textarea({ label: '文风内容', value: draft.content, rows: 12, placeholder: '详细的文风指导，对 AI 输出风格施加约束…' });
    const contentInput = contentField.querySelector('textarea');
    body.appendChild(contentField);

    const footer = el('div', { class: 'flex gap-3', style: 'justify-content:flex-end;width:100%;' });
    const cancel = global.ui.Button({ variant: 'secondary' }, '取消');
    cancel.addEventListener('click', () => m.close());
    const save = global.ui.Button({ variant: 'primary', icon: 'save' }, isNew ? '创建' : '保存');
    save.addEventListener('click', async () => {
      draft.name = nameInput.value.trim() || '未命名文风';
      draft.description = descInput.value;
      draft.content = contentInput.value;
      draft.updatedAt = new Date().toISOString();
      await global.xvdb.put('styles', draft);
      global.toast.success(isNew ? '已创建' : '已保存');
      m.close();
      load();
    });
    footer.append(cancel, save);
    const m = global.modal.open({ title: isNew ? '新建文风' : '编辑文风', body, footer, size: 'wide' });
  }

  global.pages = global.pages || {};
  global.pages.style = { match: '/style', mount, unmount };
})(window);
