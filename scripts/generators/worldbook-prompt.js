/* generators/worldbook-prompt.js — 世界书生成 prompt 构建 */
(function (global) {
  function build(formData, opts = {}) {
    const { protocol = 'json' } = opts;
    const sections = [];

    sections.push({
      role: 'system',
      content: `你是一位世界观构建大师，擅长为角色扮演场景生成系统化的世界书。
${protocol === 'json'
        ? '请以严格的 JSON 格式输出，包含字段：世界设定、历史脉络、地理环境、社会结构、文化信仰、重要势力、关键事件、人物群像。不要包含 markdown 代码块标记。'
        : '请以分章节文本输出：## 世界设定、## 历史脉络、## 地理环境、## 社会结构、## 文化信仰、## 重要势力、## 关键事件、## 人物群像。'}
内容要丰富、有深度、避免空洞，总计不少于 2000 字。`
    });

    let userContent = '请根据以下信息生成世界书：\n\n';

    if (formData.boundUsers && formData.boundUsers.length) {
      userContent += '【挂载的 user】\n';
      formData.boundUsers.forEach((u, i) => {
        userContent += `${i + 1}. ${u.name}：${u.generatedResult ? JSON.stringify(u.generatedResult).slice(0, 300) : '(无)'}\n`;
      });
      userContent += '\n';
    }
    if (formData.boundChars && formData.boundChars.length) {
      userContent += '【挂载的 char】\n';
      formData.boundChars.forEach((c, i) => {
        userContent += `${i + 1}. ${c.name}：${c.generatedResult ? JSON.stringify(c.generatedResult).slice(0, 300) : '(无)'}\n`;
      });
      userContent += '\n';
    }
    if (formData.historyTags && formData.historyTags.length) {
      userContent += `【历史背景标签】\n${formData.historyTags.join('、')}\n\n`;
    }
    if (formData.historyCustom) userContent += `【历史背景补充】\n${formData.historyCustom}\n\n`;
    if (formData.speechTags && formData.speechTags.length) {
      userContent += `【人物语言风格标签】\n${formData.speechTags.join('、')}\n\n`;
    }
    if (formData.speechCustom) userContent += `【语言风格补充】\n${formData.speechCustom}\n\n`;
    if (formData.styleContents && formData.styleContents.length) {
      userContent += '【挂载文风】\n';
      formData.styleContents.forEach((s, i) => {
        userContent += `文风 ${i + 1}（${s.name}）：\n${s.content}\n\n`;
      });
    }

    userContent += '\n请生成完整、连贯、有深度的世界书。';
    sections.push({ role: 'user', content: userContent });

    return sections;
  }

  global.worldbookPrompt = { build };
})(window);
