# API 协议适配规范

Xvshuo 叙说 支持 6 种 LLM API 协议，全部通过统一 `client.chat()` 接口调用，上层无感知差异。

## 协议列表

| 协议 | adapter | 用途 |
|------|------|------|
| `openai` | `adapters/openai.js` | OpenAI 官方 API |
| `deepseek` | 同上 | DeepSeek 官方 API（OpenAI 兼容格式） |
| `openai-compatible` | 同上 | 第三方 OpenAI 兼容网关（Moonshot / Together 等） |
| `anthropic` | `adapters/anthropic.js` | Anthropic Claude 官方 |
| `gemini` | `adapters/gemini.js` | Google Gemini 官方 |
| `custom` | `adapters/custom.js` | 自定义模板（Mustache 风格） |

## 各协议细节

### OpenAI / 兼容 / DeepSeek

- 端点：`POST {baseUrl}/v1/chat/completions`（DeepSeek 官方为 `POST {baseUrl}/chat/completions`，由协议元信息自动切换）
- 认证：`Authorization: Bearer {apiKey}`
- 请求体：`{model, messages, temperature, stream:false}`
- 模型列表：`GET {baseUrl}/v1/models`（DeepSeek 官方为 `GET {baseUrl}/models`）
- 响应提取：`data.choices[0].message.content`

### DeepSeek 官方

- Base URL：`https://api.deepseek.com`
- 默认模型：`deepseek-chat` / `deepseek-reasoner`（切换协议时自动预填）

### Anthropic

- 端点：`POST {baseUrl}/v1/messages`
- 认证：`x-api-key: {apiKey}` + `anthropic-version: 2023-06-01` + `anthropic-dangerous-direct-browser-access: true`
- 请求体：`{model, messages, system, max_tokens, temperature}`
- 模型列表：`GET {baseUrl}/v1/models`（失败时回退常用列表）
- 响应提取：`data.content[0].text`

### Gemini

- 端点：`POST {baseUrl}/v1beta/models/{model}:generateContent?key={apiKey}`
- 认证：query 参数 `key`（或 header `x-goog-api-key`）
- 请求体：`{contents:[{role,parts:[{text}]}], generationConfig:{temperature}}`
- 模型列表：`GET {baseUrl}/v1beta/models?key={apiKey}`，过滤 `gemini` 开头
- 响应提取：`data.candidates[0].content.parts[0].text`

### 自定义模板

用户配置 `customTemplate`：

- `requestTemplate`：Mustache 风格字符串，占位符 `{{messages}}` `{{model}}` `{{temperature}}` `{{system}}` `{{apiKey}}`
- `responsePath`：JSONPath，如 `choices[0].message.content`
- `headers`：自定义请求头（支持占位符替换）
- `method`：默认 POST
- `modelsEndpoint` / `modelsResponsePath`：模型拉取配置

## 统一返回

所有 adapter 返回 `{text, usage, raw}`：

- `text`：提取后的纯文本或 JSON 字符串
- `usage`：token 用量（如有）
- `raw`：原始响应对象

## 错误码

| code | 说明 |
|------|------|
| `NO_PRESET` | 未选择预设 |
| `NO_KEY` | 未填写 API Key |
| `NO_MODEL` | 未选择模型 |
| `NO_ADAPTER` | 协议不支持 |
| `AUTH_FAILED` | 401，Key 错误 |
| `RATE_LIMIT` | 429 |
| `SERVER_ERROR` | 5xx |
| `NETWORK` | 其他网络错误 |

## AI 返回格式协议

在设置页可切换：

- **结构化 JSON**：prompt 强约束 AI 返回严格 JSON，`response-parser` 多级容错解析（去 markdown 围栏 / 提取 `{...}` / 修复尾逗号 / 字段校验）
- **自由文本**：AI 自由返回，按 `## 标题` 分段解析为结构化对象

## CORS 提示

部分第三方 API 网关不允许浏览器直连。如遇 CORS 错误：
- 选择支持 CORS 的端点
- 或自建反向代理（超出本项目范围）
