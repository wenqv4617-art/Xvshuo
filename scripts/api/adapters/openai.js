/* api/adapters/openai.js — OpenAI 官方 + 兼容 协议适配 */
(function (global) {
  /**
   * @param {object} preset { baseUrl, apiKey, model, temperature, ... }
   * @param {Array<{role, content}>} messages
   * @param {object} opts
   * @returns {Promise<{text, usage, raw}>}
   */
  async function chat(preset, messages, opts = {}) {
    const meta = global.protocol.get(preset.protocol);
    const url = joinUrl(preset.baseUrl, meta.chatEndpoint || '/v1/chat/completions');
    const body = {
      model: preset.model,
      messages,
      temperature: preset.temperature ?? 0.8,
      stream: false
    };
    if (opts.maxTokens) body.max_tokens = opts.maxTokens;
    if (opts.json) body.response_format = { type: 'json_object' };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + (preset.apiKey || '')
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw await httpError(res);
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content || '';
    return { text, usage: data.usage || null, raw: data };
  }

  async function listModels(preset) {
    const meta = global.protocol.get(preset.protocol);
    const url = joinUrl(preset.baseUrl, meta.modelsEndpoint || '/v1/models');
    const res = await fetch(url, {
      headers: { 'Authorization': 'Bearer ' + (preset.apiKey || '') }
    });
    if (!res.ok) throw await httpError(res);
    const data = await res.json();
    return (data?.data || []).map((m) => m.id).filter(Boolean);
  }

  function joinUrl(base, path) {
    if (!base) throw new Error('Base URL 未配置');
    return base.replace(/\/+$/, '') + path;
  }

  async function httpError(res) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      if (j?.error?.message) msg = j.error.message;
      else if (j?.message) msg = j.message;
    } catch {}
    const e = new Error(msg);
    e.status = res.status;
    return e;
  }

  global.adapters = global.adapters || {};
  global.adapters.openai = { chat, listModels };
  global.adapters['openai-compatible'] = { chat, listModels };
  global.adapters.deepseek = { chat, listModels }; // DeepSeek 官方（OpenAI 兼容格式）
})(window);
