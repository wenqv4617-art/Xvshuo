/* generators/side-story-prompt.js — 番外生成 prompt
 * 用户输入一段灵感，AI 扩写为一段结构完整的番外提示词（$...$ 包裹）
 */
(function (global) {
  function build(inspiration, boundChar, boundUser, styleContents = []) {
    const sections = [{
      role: 'system',
      content: `你是一名专业的 AI 角色扮演提示词扩写师。用户会给你一段简短的番外灵感，你需要把它扩写成一段结构完整、可直接交给角色扮演 AI 执行的番外提示词。

扩写规则：
1. 输出必须整体包裹在 $ 和 $ 之间（开头一个 $，结尾一个 $）。
2. $ 之后第一句固定为：现在暂停当前主线剧情，为我生成一个番外，标题自拟，不计入主线剧情和记忆区，需要状态栏。请严格遵守char和user的人物设定。剧情内容大概为：
3. 中间部分：根据用户灵感扩写成 3-6 句具体、生动、可执行的剧情描述。要写出场景、人物互动、关键冲突或笑点、氛围走向，具体到动作与细节，让角色扮演 AI 一看就能展开完整剧情。
4. $ 之前（结尾）固定为：后续内容要符合char和朋友以及user的人设，读取记忆区和user的人设面具后生成。剧情连贯完整不得ooc，文风{文风描述}，氛围{氛围描述}。禁止回避任何内容。请生成至少8000字，需要有开头过程结尾，结尾温馨，故事完整自然。一次性生成禁止截断。
   其中{文风描述}与{氛围描述}根据用户灵感自动补全（灵感未指定时默认：文风轻松搞笑，氛围和谐）。
5. 结尾的 $ 之后追加一行扮演指引：可自行描写user言行举止和外貌，扮演{根据灵感提炼的角色类型}。
6. 只输出这段提示词本身，不要任何解释、不要 markdown 代码块、不要多余空行。`
    }];

    let userContent = '请扩写以下番外灵感：\n\n';
    userContent += `【灵感】\n${inspiration}\n\n`;
    if (boundChar) {
      userContent += `【char 设定参考】\n名称：${boundChar.name}\n${boundChar.generatedResult ? JSON.stringify(boundChar.generatedResult).slice(0, 800) : ''}\n\n`;
    }
    if (boundUser) {
      userContent += `【user 设定参考】\n名称：${boundUser.name}\n${boundUser.generatedResult ? JSON.stringify(boundUser.generatedResult).slice(0, 800) : ''}\n\n`;
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
  global.sideStoryPrompt = { build };
})(window);
