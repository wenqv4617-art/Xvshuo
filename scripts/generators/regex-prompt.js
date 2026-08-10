/* generators/regex-prompt.js — 正则生成 prompt */
(function (global) {
  function build(inspiration) {
    return [
      {
        role: 'system',
        content: `你是一位正则表达式专家。用户会描述一个文字替换需求，你需要返回多步正则替换规则，用于将输入文本转换为期望输出。
请以严格 JSON 数组格式返回，每个元素：{"find": "正则字符串", "replace": "替换字符串", "flags": "标志如g或gi", "description": "本步说明"}。
不要包含 markdown 代码块标记，直接输出 JSON 数组。`
      },
      {
        role: 'user',
        content: `需求描述：${inspiration}\n\n请返回对应的正则替换规则数组。`
      }
    ];
  }
  global.regexPrompt = { build };
})(window);
