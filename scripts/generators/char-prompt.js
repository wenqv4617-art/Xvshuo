/* generators/char-prompt.js — char 人设生成 prompt 构建（含 3 段开场白） */
(function (global) {
  function build(formData, opts = {}) {
    const { protocol = 'json' } = opts;
    const sections = [];

    sections.push({
      role: 'system',
      content: `你是一位资深的角色设计师，擅长为 SillyTavern / Airp / StableDiffusion 等场景生成精细的 char（AI 角色）人设。
char 与 user 的关系是相对的：user 是真实玩家，char 是被 AI 扮演的角色。
${protocol === 'json'
        ? '请以严格的 JSON 格式输出，包含字段：基础信息、外貌特征、人格特征、职业生涯、身世背景、人际关系、开场白。其中"开场白"是一个数组，包含 3 个开场白，每个开场白约 1000 字。不要包含 markdown 代码块标记。'
        : '请以分章节文本输出：## 基础信息、## 外貌特征、## 人格特征、## 职业生涯、## 身世背景、## 人际关系、## 开场白 1、## 开场白 2、## 开场白 3。3 段开场白每段约 1000 字。'}
要细腻、有文学感、避免空洞，主要内容不少于 1500 字 + 3 段开场白（每段约 1000 字）。`
    });

    let userContent = '请根据以下信息生成 char 人设档案：\n\n';

    if (formData.boundUserName) {
      userContent += `【绑定 user（作为生成依据）】\nuser 名：${formData.boundUserName}\nuser 简介：${formData.boundUserBrief || '(无)'}\n\n`;
    }
    if (formData.relation) {
      userContent += `【与该 user 的关系】\n${formData.relation}\n\n`;
    }

    userContent += '【基础信息】\n';
    if (formData.name) userContent += `姓名：${formData.name}\n`;
    if (formData.gender) userContent += `性别：${formData.gender}\n`;
    if (formData.age) userContent += `年龄：${formData.age}\n`;
    if (formData.group) userContent += `分组：${formData.group}\n`;
    userContent += '\n';

    if (formData.appearanceTags) {
      for (const [cat, tags] of Object.entries(formData.appearanceTags)) {
        if (tags && tags.length) userContent += `${cat}：${tags.join('、')}\n`;
      }
      userContent += '\n';
    }
    if (formData.personalityTags && formData.personalityTags.length) {
      userContent += `【性格特征标签】\n${formData.personalityTags.join('、')}\n\n`;
    }
    const wb = formData.worldBackgroundTags || (formData.worldBackground ? [formData.worldBackground] : []);
    if (wb.length) userContent += `【世界背景标签】\n${wb.join('、')}\n\n`;
    const pd = formData.plotDirectionTags || (formData.plotDirection ? [formData.plotDirection] : []);
    if (pd.length) userContent += `【剧本走向标签】\n${pd.join('、')}\n\n`;
    const rel = formData.relationshipsTags || (formData.relationships ? [formData.relationships] : []);
    if (rel.length) userContent += `【关系网标签】\n${rel.join('、')}\n\n`;
    const ca = formData.careerTags || (formData.career ? [formData.career] : []);
    if (ca.length) userContent += `【职业生涯标签】\n${ca.join('、')}\n\n`;
    if (formData.styleContents && formData.styleContents.length) {
      userContent += '【挂载文风（最高约束）】\n';
      formData.styleContents.forEach((s, i) => {
        userContent += `文风 ${i + 1}（${s.name}）：\n${s.content}\n\n`;
      });
    }
    if (formData.worldbookContents && formData.worldbookContents.length) {
      userContent += '【挂载世界书】\n';
      formData.worldbookContents.forEach((w, i) => {
        userContent += `世界书 ${i + 1}（${w.name}）：\n${typeof w.generatedResult === 'string' ? w.generatedResult : JSON.stringify(w.generatedResult)}\n\n`;
      });
    }
    if (formData.extraInfo) userContent += `【额外信息】\n${formData.extraInfo}\n\n`;

    userContent += '\n请生成完整 char 人设档案，并额外提供 3 段开场白（每段约 1000 字，分别展现 char 的不同状态/场景/时间点）。';
    sections.push({ role: 'user', content: userContent });

    return sections;
  }

  global.charPrompt = { build };
})(window);
