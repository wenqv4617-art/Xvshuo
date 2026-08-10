/* api/adapters/custom.js — 自定义模板协议适配
 * 用户配置：
 *   - customTemplate.requestTemplate: Mustache 风格字符串，占位符 {{messages}}, {{model}}, {{temperature}}, {{system}}, {{apiKey}}
 *   - customTemplate.responsePath: JSONPath，如 "data.result.text" 或 "choices[0].message.content"
 *   - customTemplate.headers: 自定义请求头
 *   - customTemplate.method: GET / POST（默认 POST）
 *   - customTemplate.modelsEndpoint / modelsResponsePath: 模型拉取
 */
(function (global) {
  async function chat(preset, messages, opts = {}) {
    const tpl = preset.customTemplate || {};
    const url = tpl.baseUrl || preset.baseUrl;
    if (!url) throw new Error('自定义 Base URL 未配置');

    const sysMsgs = messages.filter((m) => m.role === 'system');
    const userMsgs = messages.filter((m) => m.role !== 'system');
    const method = (tpl.method || 'POST').toUpperCase();

    let body;
    const headers = { 'Content-Type': 'application/json', ...(tpl.headers || {}) };
    // 替换 headers 中的占位符
    for (const k of Object.keys(headers)) {
      headers[k] = renderTemplate(headers[k], { model: preset.model, temperature: preset.temperature, apiKey: preset.apiKey, system: sysMsgs.map((m) => m.content).join('\n\n') });
    }

    if (tpl.requestTemplate) {
      // 用户给了完整请求体模板
      const filled = renderTemplate(tpl.requestTemplate, {
        model: preset.model,
        temperature: preset.temperature ?? 0.8,
        apiKey: preset.apiKey,
        system: sysMsgs.map((m) => m.content).join('\n\n'),
        messages: JSON.stringify(userMsgs),
        messages_raw: userMsgs
      });
      try { body = JSON.parse(filled); } catch { body = filled; }
    } else {
      // 默认 OpenAI 兼容请求体
      body = {
        model: preset.model,
        messages,
        temperature: preset.temperature ?? 0.8,
        stream: false
      };
    }

    const fetchOpts = { method, headers };
    if (method !== 'GET' && method !== 'HEAD') fetchOpts.body = typeof body === 'string' ? body : JSON.stringify(body);

    const res = await fetch(url, fetchOpts);
    if (!res.ok) throw await httpError(res);
    let data;
    try { data = await res.json(); }
    catch { data = { text: await res.text() }; }
    const text = tpl.responsePath ? extractPath(data, tpl.responsePath) : (data?.text || data?.content || JSON.stringify(data));
    return { text, usage: null, raw: data };
  }

  async function listModels(preset) {
    const tpl = preset.customTemplate || {};
    if (!tpl.modelsEndpoint) return [];
    const base = (tpl.baseUrl || preset.baseUrl || '').replace(/\/+$/, '');
    const url = tpl.modelsEndpoint.startsWith('http') ? tpl.modelsEndpoint : base + tpl.modelsEndpoint;
    const headers = { ...(tpl.headers || {}) };
    for (const k of Object.keys(headers)) {
      headers[k] = renderTemplate(headers[k], { apiKey: preset.apiKey });
    }
    const res = await fetch(url, { headers });
    if (!res.ok) return [];
    const data = await res.json().catch(() => ({}));
    if (tpl.modelsResponsePath) {
      const arr = extractPath(data, tpl.modelsResponsePath);
      return Array.isArray(arr) ? arr.map((x) => typeof x === 'string' ? x : (x.id || x.name)).filter(Boolean) : [];
    }
    if (Array.isArray(data?.data)) return data.data.map((m) => m.id).filter(Boolean);
    if (Array.isArray(data?.models)) return data.models.map((m) => m.name || m.id).filter(Boolean);
    return [];
  }

  function renderTemplate(tpl, ctx) {
    if (typeof tpl !== 'string') return tpl;
    return tpl.replace(/\{\{(\w+)(?::([^}]+))?\}\}/g, (m, key, fmt) => {
      const v = ctx[key];
      if (v == null) return '';
      if (key === 'messages' && fmt === 'json') return JSON.stringify(ctx.messages_raw || v);
      return typeof v === 'object' ? JSON.stringify(v) : String(v);
    });
  }

  function extractPath(obj, path) {
    if (!path) return obj;
    const parts = path.split(/[.[\]]+/).filter(Boolean);
    let cur = obj;
    for (const p of parts) {
      if (cur == null) return undefined;
      cur = cur[p];
    }
    return cur;
  }

  async function httpError(res) {
    let msg = `HTTP ${res.status}`;
    try { const j = await res.json(); if (j?.error?.message) msg = j.error.message; else if (j?.message) msg = j.message; } catch {}
    const e = new Error(msg); e.status = res.status; return e;
  }

  global.adapters = global.adapters || {};
  global.adapters.custom = { chat, listModels };
})(window);
