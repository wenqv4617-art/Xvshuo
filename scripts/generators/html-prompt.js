/* generators/html-prompt.js — HTML 产物生成 prompt
 * 用户输入灵感，AI 返回：执行指令头 + 带占位符的 HTML 模板
 */
(function (global) {
  function build(inspiration, boundChar, boundUser, worldbooks = [], styleContents = []) {
    const sections = [{
      role: 'system',
      content: `你是一名创意 HTML 模板设计师 + 指令工程师。用户会描述想要的可互动 HTML 产物（如问卷、互动卡片、网页），你需要返回一份"执行指令头 + 带占位符的 HTML 模板"。

输出格式（严格按以下顺序与格式）：
1. 第一行输出：1. **当且仅当用户输入"{触发词}"时执行**（触发词从灵感中提炼，通常是"生成XX内容"）
2. 然后输出：
   2. **代码输出约束**：
   * **核心警告：严禁使用 \`\`\`html 或任何 Markdown 代码块包裹！** 必须直接输出纯 JSON 字符串。
   * **压缩输出**：必须将所有代码压缩为**单行**输出，中间禁止任何换行。
   * **填充内容**：将占位符依次替换。语气要严格符合设定。*填充要求*：**严格参考char的人设、聊天记录、核心记忆、世界书**
3. 然后单独输出一行：#
4. 最后输出 HTML 模板本体：
   - 完整自包含（DOCTYPE、html、head、body 齐全），CSS 与 JS 全部内联，不依赖任何外部资源
   - 兼容移动端（viewport meta + 响应式）
   - 需要后续填充的内容用 {{占位符}} 表示，占位符语义化命名（如 {{开场白}}、{{问题1}}、{{语气词}}），至少 6 个，分布在标题、正文、交互文案、JS 逻辑中

只输出上述内容，不要任何额外解释。`
    }];

    let userContent = '请为以下灵感生成 HTML 模板与指令头：\n\n';
    userContent += `【灵感】\n${inspiration}\n\n`;
    if (boundChar) {
      userContent += `【char 设定参考（语气来源）】\n名称：${boundChar.name}\n${boundChar.generatedResult ? JSON.stringify(boundChar.generatedResult).slice(0, 800) : ''}\n\n`;
    }
    if (boundUser) {
      userContent += `【user 设定参考】\n名称：${boundUser.name}\n${boundUser.generatedResult ? JSON.stringify(boundUser.generatedResult).slice(0, 800) : ''}\n\n`;
    }
    if (worldbooks && worldbooks.length) {
      userContent += '【世界书参考】\n';
      worldbooks.forEach((w, i) => {
        userContent += `${i + 1}. ${w.name}：${typeof w.generatedResult === 'string' ? w.generatedResult.slice(0, 500) : JSON.stringify(w.generatedResult).slice(0, 500)}\n`;
      });
      userContent += '\n';
    }
    if (styleContents && styleContents.length) {
      userContent += '【文风约束】\n';
      styleContents.forEach((s, i) => {
        userContent += `文风 ${i + 1}（${s.name}）：\n${s.content}\n\n`;
      });
    }
    sections.push({ role: 'user', content: userContent });
    return sections;
  }
  global.htmlPrompt = { build };
})(window);
