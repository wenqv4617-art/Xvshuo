/* generators/user-prompt.js — user 人设生成 prompt 构建 */
(function (global) {
  function build(formData, opts = {}) {
    const { protocol = 'json' } = opts;
    const sections = [];

    // 系统指令
    sections.push({
      role: 'system',
      content: `你是一位资深的角色设计师，擅长为 SillyTavern / Airp / StableDiffusion 等场景生成精细的 user 人设。
你的输出必须严格遵循用户提供的表单数据，并以"角色档案"的形式呈现。
${protocol === 'json'
        ? '请以严格的 JSON 格式输出，包含字段：基础信息、外貌特征、人格特征、职业生涯、身世背景、人际关系。每个字段值可以是字符串或结构化对象。不要包含任何 markdown 代码块标记，直接输出 JSON。'
        : '请以分章节的文本格式输出，每个章节以 "## 章节名" 开头（## 基础信息、## 外貌特征、## 人格特征、## 职业生涯、## 身世背景、## 人际关系）。'}
输出要细腻、有文学感、避免空洞，不少于 1500 字。`
    });

    // 用户输入数据
    let userContent = '请根据以下信息生成 user 人设档案：\n\n';

    if (formData.boundCharName) {
      userContent += `【绑定 char（作为生成依据）】\nchar 名：${formData.boundCharName}\nchar 简介：${formData.boundCharBrief || '(无)'}\n\n`;
    }
    if (formData.relation) {
      userContent += `【与该 char 的关系】\n${formData.relation}\n\n`;
    }

    // 基础信息
    userContent += '【基础信息】\n';
    if (formData.name) userContent += `姓名：${formData.name}\n`;
    if (formData.gender) userContent += `性别：${formData.gender}\n`;
    if (formData.age) userContent += `年龄：${formData.age}\n`;
    if (formData.group) userContent += `分组：${formData.group}\n`;
    userContent += '\n';

    // 外貌锚点
    if (formData.appearanceTags && formData.appearanceTags.length) {
      userContent += '【外貌锚点标签】\n';
      for (const [cat, tags] of Object.entries(formData.appearanceTags)) {
        if (tags && tags.length) userContent += `${cat}：${tags.join('、')}\n`;
      }
      userContent += '\n';
    }

    // 性格
    if (formData.personalityTags && formData.personalityTags.length) {
      userContent += `【性格特征标签】\n${formData.personalityTags.join('、')}\n\n`;
    }

    // 世界背景（标签数组，兼容旧版字符串）
    const wb = formData.worldBackgroundTags || (formData.worldBackground ? [formData.worldBackground] : []);
    if (wb.length) userContent += `【世界背景额外补充标签】\n${wb.join('、')}\n\n`;

    // 剧本走向
    const pd = formData.plotDirectionTags || (formData.plotDirection ? [formData.plotDirection] : []);
    if (pd.length) userContent += `【剧本走向标签】\n${pd.join('、')}\n\n`;

    // 关系网
    const rel = formData.relationshipsTags || (formData.relationships ? [formData.relationships] : []);
    if (rel.length) userContent += `【关系网标签】\n${rel.join('、')}\n\n`;

    // 职业生涯
    const ca = formData.careerTags || (formData.career ? [formData.career] : []);
    if (ca.length) userContent += `【职业生涯标签】\n${ca.join('、')}\n\n`;

    // 挂载文风
    if (formData.styleContents && formData.styleContents.length) {
      userContent += '【挂载文风（最高约束）】\n';
      formData.styleContents.forEach((s, i) => {
        userContent += `文风 ${i + 1}（${s.name}）：\n${s.content}\n\n`;
      });
    }

    // 挂载世界书
    if (formData.worldbookContents && formData.worldbookContents.length) {
      userContent += '【挂载世界书】\n';
      formData.worldbookContents.forEach((w, i) => {
        userContent += `世界书 ${i + 1}（${w.name}）：\n${typeof w.generatedResult === 'string' ? w.generatedResult : JSON.stringify(w.generatedResult)}\n\n`;
      });
    }

    // 额外信息
    if (formData.extraInfo) {
      userContent += `【额外信息补偿】\n${formData.extraInfo}\n\n`;
    }

    userContent += '\n请生成完整、连贯、不空洞的 user 人设档案。';
    sections.push({ role: 'user', content: userContent });

    return sections;
  }

  global.userPrompt = { build };
})(window);
