/* api/adapters/anthropic.js — Anthropic 官方协议适配 */
(function (global) {
  async function chat(preset, messages, opts = {}) {
    const url = joinUrl(preset.baseUrl, '/v1/messages');
    // 提取 system
    const sysMsgs = messages.filter((m) => m.role === 'system');
    const userMsgs = messages.filter((m) => m.role !== 'system');
    const body = {
      model: preset.model,
      messages: userMsgs.map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
      max_tokens: opts.maxTokens || 8192,
      temperature: preset.temperature ?? 0.8
    };
    if (sysMsgs.length) body.system = sysMsgs.map((m) => m.content).join('\n\n');

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': preset.apiKey || '',
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw await httpError(res);
    const data = await res.json();
    const text = (data?.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('');
    return { text, usage: data.usage || null, raw: data };
  }

  async function listModels(preset) {
    try {
      const url = joinUrl(preset.baseUrl, '/v1/models');
      const res = await fetch(url, {
        headers: {
          'x-api-key': preset.apiKey || '',
          'anthropic-version': '2023-06-01'
        }
      });
      if (!res.ok) throw new Error('list failed');
      const data = await res.json();
      return (data?.data || []).map((m) => m.id).filter(Boolean);
    } catch {
      // Anthropic 模型列表端点可能未开放，回退常用列表
      return ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'];
    }
  }

  function joinUrl(base, path) {
    if (!base) throw new Error('Base URL 未配置');
    return base.replace(/\/+$/, '') + path;
  }
  async function httpError(res) {
    let msg = `HTTP ${res.status}`;
    try { const j = await res.json(); if (j?.error?.message) msg = j.error.message; } catch {}
    const e = new Error(msg); e.status = res.status; return e;
  }

  global.adapters = global.adapters || {};
  global.adapters.anthropic = { chat, listModels };
})(window);
