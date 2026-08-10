/* api/response-parser.js — AI 返回解析（双模式：JSON / 自由文本） */
(function (global) {
  /**
   * 解析 AI 返回的内容为结构化对象
   * @param {string} text
   * @param {'json'|'text'} mode
   * @param {string[]} requiredFields  必填字段（如 ['基础信息','外貌特征',...]）
   */
  function parse(text, mode = 'json', requiredFields = []) {
    if (!text) return { ok: false, data: null, raw: '', error: '空响应' };
    if (mode === 'json') return parseJsonMode(text, requiredFields);
    return parseTextMode(text, requiredFields);
  }

  function parseJsonMode(text, requiredFields) {
    let cleaned = stripCodeFence(text).trim();
    // 尝试直接 parse
    let obj = tryJson(cleaned);
    if (obj == null) {
      // 尝试提取第一个 {...} 块
      const m = cleaned.match(/\{[\s\S]*\}/);
      if (m) obj = tryJson(m[0]);
    }
    if (obj == null) {
      // 尝试修复常见 JSON 错误（尾逗号 / 单引号）
      const fixed = cleaned
        .replace(/,\s*([}\]])/g, '$1')   // 去尾逗号
        .replace(/'/g, '"');              // 单引号 → 双引号
      const m = fixed.match(/\{[\s\S]*\}/);
      if (m) obj = tryJson(m[0]);
    }
    if (obj == null) {
      return { ok: false, data: null, raw: text, error: 'JSON 解析失败' };
    }
    const missing = requiredFields.filter((f) => !(f in obj) && !findKey(obj, f));
    return {
      ok: missing.length === 0,
      data: obj,
      raw: text,
      error: missing.length ? `缺少字段: ${missing.join('、')}` : null
    };
  }

  function parseTextMode(text, requiredFields) {
    // 按标记分段（## 标题 或 数字. 标题）
    const sections = {};
    const re = /(?:^|\n)#{1,3}\s*([^\n]+)\n([\s\S]*?)(?=\n#{1,3}\s|$)/g;
    let m;
    while ((m = re.exec(text)) !== null) {
      sections[m[1].trim()] = m[2].trim();
    }
    // 兜底：用 requiredFields 关键词切分
    if (Object.keys(sections).length === 0 && requiredFields.length) {
      let rest = text;
      for (const f of requiredFields) {
        const idx = rest.indexOf(f);
        if (idx >= 0) {
          const after = rest.slice(idx + f.length).replace(/^[:：\s]+/, '');
          // 找下一个字段
          let end = after.length;
          for (const f2 of requiredFields) {
            if (f2 === f) continue;
            const i2 = after.indexOf(f2);
            if (i2 >= 0 && i2 < end) end = i2;
          }
          sections[f] = after.slice(0, end).trim();
        }
      }
    }
    const missing = requiredFields.filter((f) => !sections[f] && !findKey(sections, f));
    return {
      ok: Object.keys(sections).length > 0,
      data: sections,
      raw: text,
      error: missing.length ? `缺少字段: ${missing.join('、')}` : null
    };
  }

  function tryJson(s) { try { return JSON.parse(s); } catch { return null; } }
  function stripCodeFence(s) {
    return s
      .replace(/^```(?:json|JSON)?\s*\n?/, '')
      .replace(/\n?```\s*$/, '')
      .trim();
  }
  function findKey(obj, key) {
    if (!obj || typeof obj !== 'object') return null;
    // 模糊匹配（忽略大小写、空格）
    const lk = key.toLowerCase().replace(/\s/g, '');
    for (const k of Object.keys(obj)) {
      if (k.toLowerCase().replace(/\s/g, '') === lk) return obj[k];
    }
    return null;
  }

  global.responseParser = { parse };
})(window);
