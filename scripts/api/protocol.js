/* api/protocol.js — 协议元信息 */
(function (global) {
  const PROTOCOLS = {
    openai: {
      key: 'openai',
      label: 'OpenAI 官方',
      defaultBaseUrl: 'https://api.openai.com',
      auth: { type: 'bearer', header: 'Authorization', prefix: 'Bearer ' },
      chatEndpoint: '/v1/chat/completions',
      modelsEndpoint: '/v1/models',
      supportsSystem: true,
      defaultModels: []
    },
    deepseek: {
      key: 'deepseek',
      label: 'DeepSeek 官方',
      defaultBaseUrl: 'https://api.deepseek.com',
      auth: { type: 'bearer', header: 'Authorization', prefix: 'Bearer ' },
      chatEndpoint: '/chat/completions',
      modelsEndpoint: '/models',
      supportsSystem: true,
      defaultModels: ['deepseek-chat', 'deepseek-reasoner']
    },
    'openai-compatible': {
      key: 'openai-compatible',
      label: 'OpenAI 兼容',
      defaultBaseUrl: '',
      auth: { type: 'bearer', header: 'Authorization', prefix: 'Bearer ' },
      chatEndpoint: '/v1/chat/completions',
      modelsEndpoint: '/v1/models',
      supportsSystem: true,
      defaultModels: []
    },
    anthropic: {
      key: 'anthropic',
      label: 'Anthropic 官方',
      defaultBaseUrl: 'https://api.anthropic.com',
      auth: { type: 'x-api-key', header: 'x-api-key', prefix: '', extra: { 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' } },
      chatEndpoint: '/v1/messages',
      modelsEndpoint: '/v1/models',
      supportsSystem: true,
      requiresMaxTokens: true
    },
    gemini: {
      key: 'gemini',
      label: 'Gemini 官方',
      defaultBaseUrl: 'https://generativelanguage.googleapis.com',
      auth: { type: 'query', param: 'key' },
      chatEndpointPattern: '/v1beta/models/{model}:generateContent',
      modelsEndpoint: '/v1beta/models',
      supportsSystem: false
    },
    custom: {
      key: 'custom',
      label: '自定义模板',
      defaultBaseUrl: '',
      auth: { type: 'custom' },
      supportsSystem: true
    }
  };

  function get(key) { return PROTOCOLS[key] || PROTOCOLS.openai; }
  function list() { return Object.values(PROTOCOLS); }

  global.protocol = { PROTOCOLS, get, list };
})(window);
