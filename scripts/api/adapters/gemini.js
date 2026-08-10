/* api/adapters/gemini.js — Gemini 官方协议适配 */
(function (global) {
  async function chat(preset, messages, opts = {}) {
    const model = preset.model || 'gemini-1.5-pro';
    const base = (preset.baseUrl || 'https://generativelanguage.googleapis.com').replace(/\/+$/, '');
    const url = `${base}/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(preset.apiKey || '')}`;

    // Gemini 消息格式：contents[].parts[].text
    // system 转为 systemInstruction
    const sysMsgs = messages.filter((m) => m.role === 'system');
    const userMsgs = messages.filter((m) => m.role !== 'system');
    const body = {
      contents: userMsgs.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      })),
      generationConfig: {
        temperature: preset.temperature ?? 0.8,
        maxOutputTokens: opts.maxTokens || 8192
      }
    };
    if (sysMsgs.length) body.systemInstruction = { parts: [{ text: sysMsgs.map((m) => m.content).join('\n\n') }] };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw await httpError(res);
    const data = await res.json();
    const text = (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text).join('');
    return { text, usage: data.usageMetadata || null, raw: data };
  }

  async function listModels(preset) {
    const base = (preset.baseUrl || 'https://generativelanguage.googleapis.com').replace(/\/+$/, '');
    const url = `${base}/v1beta/models?key=${encodeURIComponent(preset.apiKey || '')}`;
    const res = await fetch(url);
    if (!res.ok) throw await httpError(res);
    const data = await res.json();
    return (data?.models || []).map((m) => m.name.replace(/^models\//, '')).filter((n) => n.includes('gemini'));
  }

  async function httpError(res) {
    let msg = `HTTP ${res.status}`;
    try { const j = await res.json(); if (j?.error?.message) msg = j.error.message; } catch {}
    const e = new Error(msg); e.status = res.status; return e;
  }

  global.adapters = global.adapters || {};
  global.adapters.gemini = { chat, listModels };
})(window);
