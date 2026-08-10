/* utils/export.js — 导出工具（JSON / TXT / DOCX）
 * 用 docx.js（CDN 加载）生成 .docx
 * 一键复制：navigator.clipboard + fallback
 */
(function (global) {
  // ===== JSON 导出 =====
  function exportJSON(filename, data) {
    const json = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    global.fmt.download(filename + '.json', json, 'application/json');
  }

  // ===== TXT 导出 =====
  function exportTXT(filename, text) {
    global.fmt.download(filename + '.txt', text, 'text/plain;charset=utf-8');
  }

  // ===== DOCX 导出 =====
  // docx.js UMD 全局为 `docx`
  async function exportDOCX(filename, sections, meta = {}) {
    if (typeof global.docx === 'undefined') {
      throw new Error('docx.js 未加载');
    }
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = global.docx;

    const children = [];
    // 标题
    if (meta.title) {
      children.push(new Paragraph({
        text: meta.title,
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 }
      }));
    }
    if (meta.subtitle) {
      children.push(new Paragraph({
        children: [new TextRun({ text: meta.subtitle, italics: true, color: '666666' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 480 }
      }));
    }
    // 分节
    for (const sec of sections) {
      if (sec.heading) {
        children.push(new Paragraph({
          text: sec.heading,
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 360, after: 160 }
        }));
      }
      if (sec.subheading) {
        children.push(new Paragraph({
          text: sec.subheading,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 120 }
        }));
      }
      if (sec.body) {
        const lines = String(sec.body).split(/\r?\n/);
        for (const line of lines) {
          children.push(new Paragraph({
            children: [new TextRun({ text: line, size: 22 })],
            spacing: { after: 80 }
          }));
        }
      }
      if (sec.list) {
        for (const item of sec.list) {
          children.push(new Paragraph({
            text: '· ' + item,
            spacing: { after: 60 }
          }));
        }
      }
    }

    const doc = new Document({ sections: [{ children }] });
    const blob = await Packer.toBlob(doc);
    global.fmt.download(filename + '.docx', blob);
  }

  // ===== 一键复制 =====
  async function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {}
    }
    // Fallback: textarea + execCommand
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.top = '-1000px';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }

  global.xexport = { exportJSON, exportTXT, exportDOCX, copyText };
})(window);
