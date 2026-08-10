/* components/tag-library.js — 标签库（分类手风琴 + 多选 + 自定义标签增删）
 * 分类手风琴支持多开（互不干扰）；自定义标签可单个删除、也可按分类整组删除
 */
(function (global) {
  const _d = global.dom;

  /**
   * @param {object} cfg
   * @param {Array<{key:string, label:string, tags:string[]}>} cfg.categories  分类树
   * @param {Set<string>} cfg.selected
   * @param {function} cfg.onChange  (selected:Set)=>void
   * @param {Set<string>} [cfg.removable]  这些标签显示删除图标（自定义标签）
   * @param {boolean} [cfg.allowAdd=true]  是否显示新增按钮
   * @param {function} [cfg.onAdd]  新增回调 (categoryKey, value)=>void
   * @param {function} [cfg.onRemove]  单个删除回调 (categoryKey, value)=>void
   * @param {function} [cfg.onClearCat]  整组删除回调 (categoryKey)=>void
   */
  function make({ categories, selected, onChange, removable, allowAdd = true, onAdd, onRemove, onClearCat }) {
    const sel = new Set(selected || []);
    const removableSet = new Set(removable || []);
    const root = _d.el('div', { class: 'taglib' });

    // 搜索
    const searchWrap = _d.el('div', { class: 'taglib-search' });
    searchWrap.insertAdjacentHTML('afterbegin', global.icons.icon('search', 14));
    const searchInput = _d.el('input', { placeholder: '筛选标签…', type: 'search' });
    searchWrap.appendChild(searchInput);
    root.appendChild(searchWrap);

    // 分类手风琴容器
    const accWrap = _d.el('div', { class: 'taglib-acc' });
    root.appendChild(accWrap);

    // 已展开的分类（多开，默认展开第一个）
    const openCats = new Set(categories.length ? [categories[0].key] : []);
    let filter = '';

    function renderAll() {
      _d.clear(accWrap);
      const lower = filter.trim().toLowerCase();
      for (let ci = 0; ci < categories.length; ci++) {
        const cat = categories[ci];
        const list = cat.tags.filter((t) => !lower || t.toLowerCase().includes(lower));
        const isOpen = openCats.has(cat.key);

        const item = _d.el('div', { class: 'accordion-item' + (isOpen ? ' is-open' : '') });

        // 分类头（编号 + 标题 + 计数 + 删除图标 + 箭头）
        const header = _d.el('button', { class: 'accordion-header catbar__header', type: 'button' });
        const meta = _d.el('div', { class: 'accordion-meta' });
        meta.appendChild(_d.el('span', { class: 'accordion-num' }, String(ci + 1).padStart(2, '0')));
        meta.appendChild(_d.el('span', { class: 'accordion-title catbar__title' }, cat.label));
        header.appendChild(meta);
        const right = _d.el('div', { class: 'flex items-center gap-2' });
        right.appendChild(_d.el('span', { class: 'catbar__count' }, String(list.length)));
        // 删除该分类自定义标签的小图标
        if (onClearCat) {
          const clearBtn = _d.el('span', {
            class: 'catbar__clear',
            html: global.icons.icon('trash', 13),
            title: '删除该分类下已添加的标签'
          });
          clearBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            onClearCat(cat.key);
          });
          right.appendChild(clearBtn);
        }
        right.insertAdjacentHTML('beforeend', `<span class="accordion-chevron">${global.icons.icon('chevron-down', 18)}</span>`);
        header.appendChild(right);
        header.addEventListener('click', () => {
          if (openCats.has(cat.key)) openCats.delete(cat.key);
          else openCats.add(cat.key);
          renderAll();
        });

        // 分类体：标签 chips + 新增
        const body = _d.el('div', { class: 'accordion-body' });
        const inner = _d.el('div', { class: 'accordion-inner' });
        const tagsWrap = _d.el('div', { class: 'taglib-tags' });
        if (!list.length) {
          tagsWrap.appendChild(_d.el('div', { class: 'taglib-empty' }, lower ? '无匹配' : '该分类暂无标签'));
        } else {
          for (const tag of list) {
            const chip = _d.el('button', {
              class: 'chip' + (sel.has(tag) ? ' is-selected' : ''),
              type: 'button'
            }, tag);
            if (removableSet.has(tag) && onRemove) chip.appendChild(makeClose(cat, tag));
            chip.addEventListener('click', () => {
              if (sel.has(tag)) sel.delete(tag); else sel.add(tag);
              chip.classList.toggle('is-selected', sel.has(tag));
              onChange && onChange(new Set(sel));
            });
            tagsWrap.appendChild(chip);
          }
        }
        inner.appendChild(tagsWrap);

        if (allowAdd && onAdd) {
          const addWrap = _d.el('div', { class: 'flex items-center gap-2', style: 'margin-top:var(--space-3);flex-wrap:wrap;' });
          const addInp = _d.el('input', { class: 'input', placeholder: `新增到「${cat.label}」…`, style: 'height:32px;font-size:var(--fs-xs);min-width:140px;flex:1 1 160px;' });
          const addBtn = _d.el('button', { class: 'btn btn--sm btn--secondary', type: 'button' }, '添加');
          addBtn.addEventListener('click', async () => {
            const v = addInp.value.trim();
            if (!v) return;
            await onAdd(cat.key, v);
            addInp.value = '';
          });
          addInp.addEventListener('keydown', (e) => { if (e.key === 'Enter') addBtn.click(); });
          addWrap.append(addInp, addBtn);
          inner.appendChild(addWrap);
        }

        body.appendChild(inner);
        item.append(header, body);
        accWrap.appendChild(item);
      }
    }

    function makeClose(cat, tag) {
      const close = _d.el('span', { class: 'chip__remove', html: global.icons.icon('close', 10) });
      close.addEventListener('click', (e) => {
        e.stopPropagation();
        onRemove && onRemove(cat.key, tag);
      });
      return close;
    }

    // 搜索时自动展开有匹配的分类
    searchInput.addEventListener('input', (e) => {
      filter = e.target.value;
      const lower = filter.trim().toLowerCase();
      if (lower) {
        for (const cat of categories) {
          if (cat.tags.some((t) => t.toLowerCase().includes(lower))) openCats.add(cat.key);
        }
      }
      renderAll();
    });

    renderAll();

    return {
      root,
      getSelected: () => new Set(sel),
      setSelected: (arr) => {
        sel.clear();
        for (const s of arr) sel.add(s);
        renderAll();
      }
    };
  }

  global.taglib = { make };
})(window);
