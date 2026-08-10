/* utils/id.js — UUID 生成器 */
window.uid = function uid(prefix = '') {
  // 优先用 crypto.randomUUID（现代浏览器含 iOS Safari 15.4+）
  if (window.crypto && crypto.randomUUID) {
    return prefix + crypto.randomUUID();
  }
  // 回退方案
  return prefix + 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};
