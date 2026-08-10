/* api/client.js — 统一 API 客户端
 * 根据 preset.protocol 分发到对应 adapter
 * 返回统一格式 {text, usage, raw}
 */
(function (global) {
  async function chat(preset, messages, opts = {}) {
    if (!preset) {
      const e = new Error('未选择 API 预设'); e.code = 'NO_PRESET'; throw e;
    }
    if (!preset.apiKey && preset.protocol !== 'custom') {
      const e = new Error('未填写 API Key'); e.code = 'NO_KEY'; throw e;
    }
    if (!preset.model) {
      const e = new Error('未选择模型'); e.code = 'NO_MODEL'; throw e;
    }

    const adapter = global.adapters?.[preset.protocol];
    if (!adapter) {
      const e = new Error(`不支持的协议: ${preset.protocol}`); e.code = 'NO_ADAPTER'; throw e;
    }

    try {
      const result = await adapter.chat(preset, messages, opts);
      return result;
    } catch (e) {
      // 统一错误码映射
      if (e.status === 401) e.code = 'AUTH_FAILED';
      else if (e.status === 429) e.code = 'RATE_LIMIT';
      else if (e.status >= 500) e.code = 'SERVER_ERROR';
      else if (!e.code) e.code = 'NETWORK';
      throw e;
    }
  }

  async function listModels(preset) {
    const adapter = global.adapters?.[preset.protocol];
    if (!adapter) throw new Error('不支持的协议');
    return adapter.listModels(preset);
  }

  /** 取当前激活预设 */
  async function getActivePreset() {
    const s = await global.xvdb.get('settings', 'global');
    if (!s || !s.activePresetId) return null;
    return global.xvdb.get('apiPresets', s.activePresetId);
  }

  /** 用当前激活预设调用（便捷方法） */
  async function chatWithActive(messages, opts = {}) {
    const preset = await getActivePreset();
    return chat(preset, messages, opts);
  }

  global.api = { chat, listModels, getActivePreset, chatWithActive };
})(window);
