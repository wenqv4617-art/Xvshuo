/* pages/archive.js — 档案库完整实现
 * 分类：user / char / 正则 / 番外 / HTML
 * 功能：列表 / 查看（预览）/ 编辑 / 删除 / 导出（json/txt/docx） / 一键复制
 */
(function (global) {
  const { el } = global.dom;
  let state = {
    tab: 'user',
    items: [],
    search: '',
    detailItem: null
  };

  const TABS = [
    { key: 'user', label: 'user', table: 'userPersonas' },
    { key: 'char', label: 'char', table: 'charPersonas' },
    { key: 'regex', label: '正则', table: 'regexRules' },
    { key: 'sideStory', label: '番外', table: 'sideStories' },
    { key: 'html', label: 'HTML', table: 'htmlSnippets' }
  ];

  async function loadItems() {
    const t = TABS.find((x) => x.key === state.tab);
    state.items = await global.xvdb.all(t.table);
    renderList();
  }

  function mount(params) {
    // 每次进入档案库都完整重置状态，避免跨页面残留旧 tab/旧数据
    state.detailItem = null;
    state.search = '';
    if (params && params.kind && TABS.some((t) => t.key === params.kind)) {
      state.tab = params.kind;
    }
    loadItems();
    render();
  }
  function unmount() { state.detailItem = null; }

  function render() {
    const root = document.getElementById('archiveMount');
    if (!root) return;
    global.dom.clear(root);

    // 搜索栏置顶（整行，不溢出）
    const searchBar = el('div', { class: 'archive-search' });
    const search = el('div', { class: 'search-input' });
    search.insertAdjacentHTML('afterbegin', global.icons.icon('search', 16));
    const sIn = el('input', { type: 'search', placeholder: '搜索档案…' });
    sIn.value = state.search;
    sIn.addEventListener('input', () => { state.search = sIn.value; renderList(); });
    search.appendChild(sIn);
    searchBar.appendChild(search);
    root.appendChild(searchBar);

    // 分类标题（分类切换走侧边栏；数量统计已移除，避免统计口径引发困惑）
    const curTab = TABS.find((t) => t.key === state.tab) || TABS[0];
    const pageHead = el('div', { class: 'archive-page-head' });
    pageHead.appendChild(el('div', { class: 'archive-page-head__title' }, curTab.label));
    root.appendChild(pageHead);

    // 列表容器
    const listWrap = el('div', { id: 'archiveList', class: 'archive-grid' });
    root.appendChild(listWrap);
    renderList();
  }

  function renderList() {
    const wrap = document.getElementById('archiveList');
    if (!wrap) return;
    global.dom.clear(wrap);
    const lower = state.search.trim().toLowerCase();
    const filtered = state.items.filter((it) => {
      if (!lower) return true;
      return (it.name || '').toLowerCase().includes(lower) ||
             JSON.stringify(it).toLowerCase().includes(lower);
    });
    if (!filtered.length) {
      wrap.appendChild(global.ui.EmptyState({
        icon: 'archive',
        title: '暂无' + (TABS.find((t) => t.key === state.tab)?.label || '') + '档案',
        hint: '在对应入口创建后，会出现在这里'
      }));
      return;
    }
    for (const it of filtered) {
      wrap.appendChild(renderCard(it));
    }
  }

  function renderCard(it) {
    const card = el('div', { class: 'archive-card' });
    card.appendChild(el('div', { class: 'archive-card__title' }, it.name || '(未命名)'));
    const meta = el('div', { class: 'archive-card__meta' });
    meta.appendChild(el('span', null, global.fmt.fmtRelative(it.updatedAt || it.createdAt)));
    if (it.groupId) meta.appendChild(el('span', { class: 'tag tag--group' }, '分组'));
    card.appendChild(meta);
    // 摘要
    let excerpt = '';
    if (state.tab === 'user' || state.tab === 'char') {
      excerpt = it.generatedResult ? JSON.stringify(it.generatedResult).slice(0, 200) : '（未生成）';
    } else if (state.tab === 'regex') {
      excerpt = it.description || ((it.patterns || []).map((p) => p.find).join(' · '));
    } else if (state.tab === 'sideStory') {
      excerpt = (it.content || it.inspiration || '').slice(0, 200);
    } else if (state.tab === 'html') {
      excerpt = (it.inspiration || '').slice(0, 200);
    }
    card.appendChild(el('div', { class: 'archive-card__excerpt' }, excerpt || '—'));

    // 操作
    const actions = el('div', { class: 'archive-card__actions' });
    const viewBtn = global.ui.IconBtn({ icon: 'eye', label: '查看' });
    viewBtn.addEventListener('click', () => openDetail(it));
    actions.appendChild(viewBtn);

    const exportBtn = global.ui.IconBtn({ icon: 'download', label: '导出' });
    exportBtn.addEventListener('click', (e) => { e.stopPropagation(); openExportMenu(it); });
    actions.appendChild(exportBtn);

    const copyBtn = global.ui.IconBtn({ icon: 'copy', label: '复制' });
    copyBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const text = serializeForCopy(it);
      const ok = await global.xexport.copyText(text);
      if (ok) global.toast.success('已复制到剪贴板');
      else global.toast.error('复制失败');
    });
    actions.appendChild(copyBtn);

    const delBtn = global.ui.IconBtn({ icon: 'trash', danger: true, label: '删除' });
    delBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const ok = await global.modal.confirm({
        title: '删除档案',
        message: `确定删除「${it.name || '未命名'}」？此操作不可撤销。`,
        confirmText: '删除',
        danger: true
      });
      if (!ok) return;
      const t = TABS.find((x) => x.key === state.tab);
      await global.xvdb.del(t.table, it.id);
      global.toast.success('已删除');
      loadItems();
    });
    actions.appendChild(delBtn);

    card.appendChild(actions);
    card.addEventListener('click', () => openDetail(it));
    return card;
  }

  // 详情 Modal
  function openDetail(it) {
    const body = el('div', { class: 'detail-view' });
    // 顶部 meta
    const meta = el('div', { class: 'detail-meta' });
    addMeta(meta, '名称', it.name);
    addMeta(meta, '创建', global.fmt.fmtDate(it.createdAt));
    addMeta(meta, '更新', global.fmt.fmtDate(it.updatedAt));
    if (it.groupId) addMeta(meta, '分组', it.groupId);
    body.appendChild(meta);

    // 内容渲染
    if (state.tab === 'user' || state.tab === 'char') {
      renderPersonaDetail(body, it);
    } else if (state.tab === 'regex') {
      renderRegexDetail(body, it);
    } else if (state.tab === 'sideStory') {
      renderSideStoryDetail(body, it);
    } else if (state.tab === 'html') {
      renderHtmlDetail(body, it);
    }

    // 底部操作
    const footer = el('div', { class: 'flex gap-3', style: 'justify-content:flex-end;width:100%;flex-wrap:wrap;' });
    const exportJson = global.ui.Button({ variant: 'secondary', size: 'sm', icon: 'download' }, 'JSON');
    exportJson.addEventListener('click', () => doExport(it, 'json'));
    const exportTxt = global.ui.Button({ variant: 'secondary', size: 'sm', icon: 'download' }, 'TXT');
    exportTxt.addEventListener('click', () => doExport(it, 'txt'));
    const exportDocx = global.ui.Button({ variant: 'secondary', size: 'sm', icon: 'download' }, 'DOCX');
    exportDocx.addEventListener('click', () => doExport(it, 'docx'));
    const copyBtn = global.ui.Button({ variant: 'primary', size: 'sm', icon: 'copy' }, '复制');
    copyBtn.addEventListener('click', async () => {
      const ok = await global.xexport.copyText(serializeForCopy(it));
      if (ok) global.toast.success('已复制'); else global.toast.error('复制失败');
    });
    footer.append(exportJson, exportTxt, exportDocx, copyBtn);

    global.modal.open({
      title: state.tab.toUpperCase() + ' 档案',
      body,
      footer,
      size: 'wide'
    });
  }

  function addMeta(parent, label, value) {
    parent.appendChild(el('div', { class: 'detail-meta__label' }, label));
    parent.appendChild(el('div', { class: 'detail-meta__value' }, value || '—'));
  }

  function renderPersonaDetail(parent, it) {
    const r = it.generatedResult || {};
    if (it.relation) addSection(parent, '关系', it.relation);
    if (r['基础信息']) addSection(parent, '基础信息', r['基础信息']);
    if (r['外貌特征']) addSection(parent, '外貌特征', r['外貌特征']);
    if (r['人格特征']) addSection(parent, '人格特征', r['人格特征']);
    if (r['职业生涯']) addSection(parent, '职业生涯', r['职业生涯']);
    if (r['身世背景']) addSection(parent, '身世背景', r['身世背景']);
    if (r['人际关系']) addSection(parent, '人际关系', r['人际关系']);
    if (it.openingMessages && it.openingMessages.length) {
      it.openingMessages.forEach((m, i) => addSection(parent, `开场白 ${i + 1}`, m));
    }
    if (!Object.keys(r).length && !it.relation) {
      parent.appendChild(global.ui.EmptyState({ title: '尚未生成内容', hint: '请回到生成页完成 AI 调用' }));
    }
  }

  function renderRegexDetail(parent, it) {
    addSection(parent, '描述', it.description);
    (it.patterns || []).forEach((p, i) => {
      addSection(parent, `步骤 ${i + 1} · ${p.find}`, `替换为: ${p.replace}\n标志: ${p.flags || 'g'}`);
    });
  }

  function renderSideStoryDetail(parent, it) {
    addSection(parent, '灵感', it.inspiration);
    addSection(parent, '正文', it.content);
  }

  function renderHtmlDetail(parent, it) {
    addSection(parent, '灵感', it.inspiration);
    if (it.html) {
      // 预览 iframe
      const iframeWrap = el('div', { class: 'card', style: 'padding:0;overflow:hidden;margin-top:var(--space-4);' });
      const iframe = el('iframe', {
        style: 'width:100%;height:400px;border:0;background:#fff;',
        sandbox: 'allow-scripts'
      });
      iframeWrap.appendChild(iframe);
      parent.appendChild(iframeWrap);
      // 通过 srcdoc 注入
      iframe.srcdoc = it.html;
    }
  }

  function addSection(parent, heading, body) {
    if (body == null || body === '') return;
    const sec = el('section', { class: 'detail-section' });
    sec.appendChild(el('h3', { class: 'detail-section__title' },
      el('span', { class: 'detail-section__num' }, '·'),
      document.createTextNode(heading)
    ));
    const text = typeof body === 'object' ? JSON.stringify(body, null, 2) : String(body);
    sec.appendChild(el('pre', { style: 'white-space:pre-wrap;font-family:var(--font-sans);font-size:var(--fs-body);line-height:1.7;color:var(--color-ink-soft);' }, text));
    parent.appendChild(sec);
  }

  // 导出菜单（modal 选择格式）
  function openExportMenu(it) {
    const body = el('div', { class: 'flex flex-col gap-3' });
    const jsonBtn = global.ui.Button({ variant: 'secondary', block: true, icon: 'download' }, 'JSON 格式');
    jsonBtn.addEventListener('click', () => { m.close(); doExport(it, 'json'); });
    const txtBtn = global.ui.Button({ variant: 'secondary', block: true, icon: 'download' }, 'TXT 格式');
    txtBtn.addEventListener('click', () => { m.close(); doExport(it, 'txt'); });
    const docxBtn = global.ui.Button({ variant: 'secondary', block: true, icon: 'download' }, 'DOCX 格式');
    docxBtn.addEventListener('click', () => { m.close(); doExport(it, 'docx'); });
    body.append(jsonBtn, txtBtn, docxBtn);
    const m = global.modal.open({ title: '导出格式', body, size: 'narrow' });
  }

  async function doExport(it, fmt) {
    const baseName = (it.name || 'xvshuo-export').replace(/[\\/:*?"<>|]/g, '_');
    try {
      if (fmt === 'json') {
        global.xexport.exportJSON(baseName, it);
        global.toast.success('已导出 JSON');
      } else if (fmt === 'txt') {
        global.xexport.exportTXT(baseName, serializeForCopy(it));
        global.toast.success('已导出 TXT');
      } else if (fmt === 'docx') {
        const sections = buildDocxSections(it);
        await global.xexport.exportDOCX(baseName, sections, { title: it.name, subtitle: 'Xvshuo ' + state.tab.toUpperCase() });
        global.toast.success('已导出 DOCX');
      }
    } catch (e) {
      global.toast.error('导出失败: ' + e.message);
    }
  }

  function serializeForCopy(it) {
    if (state.tab === 'html' && it.html) return it.html;
    if (state.tab === 'sideStory' && it.content) return it.content;
    return JSON.stringify(it, null, 2);
  }

  function buildDocxSections(it) {
    const sections = [];
    const r = it.generatedResult || {};
    if (it.relation) sections.push({ heading: '关系', body: it.relation });
    for (const k of ['基础信息', '外貌特征', '人格特征', '职业生涯', '身世背景', '人际关系']) {
      if (r[k]) sections.push({ heading: k, body: typeof r[k] === 'object' ? JSON.stringify(r[k], null, 2) : r[k] });
    }
    if (it.openingMessages) {
      it.openingMessages.forEach((m, i) => sections.push({ heading: `开场白 ${i + 1}`, body: m }));
    }
    if (it.description) sections.push({ heading: '描述', body: it.description });
    if (it.patterns) {
      it.patterns.forEach((p, i) => sections.push({ heading: `步骤 ${i + 1}`, body: `查找: ${p.find}\n替换: ${p.replace}\n标志: ${p.flags || 'g'}` }));
    }
    if (it.inspiration) sections.push({ heading: '灵感', body: it.inspiration });
    if (it.content) sections.push({ heading: '正文', body: it.content });
    if (it.html) sections.push({ heading: 'HTML 源码', body: it.html });
    return sections;
  }

  global.pages = global.pages || {};
  global.pages.archive = { match: '/archive', mount, unmount };
  global.pages['archive/:kind'] = { match: '/archive/:kind', mount, unmount };
  global.pages['archive-detail'] = {
    match: '/archive/:type/:id',
    mount() { global.router.navigate('/archive'); },
    unmount() {}
  };
})(window);
