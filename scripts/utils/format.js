/* utils/format.js — 格式化工具 */
(function (global) {
  function fmtDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${y}/${m}/${day} ${hh}:${mm}`;
  }
  function fmtRelative(iso) {
    if (!iso) return '';
    const d = new Date(iso).getTime();
    const now = Date.now();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return '刚刚';
    if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} 天前`;
    return fmtDate(iso);
  }
  function fmtBytes(n) {
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    if (n < 1024 * 1024 * 1024) return (n / 1024 / 1024).toFixed(2) + ' MB';
    return (n / 1024 / 1024 / 1024).toFixed(2) + ' GB';
  }
  function truncate(s, n) {
    if (!s) return '';
    s = String(s);
    return s.length > n ? s.slice(0, n) + '…' : s;
  }
  function safeJSON(s, fb) {
    try { return JSON.parse(s); } catch { return fb; }
  }
  // 是否为 Android WebView（APK 壳通过 UA 注入 XvshuoNative 标记）
  function isNativeApp() {
    return (typeof window.XVSHUO_NATIVE !== 'undefined' && window.XVSHUO_NATIVE) ||
           /XvshuoNative/i.test(navigator.userAgent || '');
  }
  function triggerBlobDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
  // 原生兜底：以 data URI + <a download> 触发，由原生 onDownloadStart 保存到下载目录
  function fallbackDataUriDownload(dataUrl, filename) {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
  function download(filename, content, mime = 'application/octet-stream') {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
    if (isNativeApp()) {
      // Android WebView：优先调用原生分享桥，弹系统分享框（QQ/微信/邮件等）
      if (window.XvshuoNative && typeof window.XvshuoNative.shareFile === 'function') {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = String(reader.result || '');
          const comma = dataUrl.indexOf(',');
          const b64 = comma >= 0 ? dataUrl.substring(comma + 1) : '';
          const type = blob.type || mime || 'application/octet-stream';
          try {
            window.XvshuoNative.shareFile(filename, type, b64);
            return;
          } catch (e) { /* 桥异常时回退 */ }
          fallbackDataUriDownload(dataUrl, filename);
        };
        reader.onerror = () => triggerBlobDownload(blob, filename);
        reader.readAsDataURL(blob);
        return;
      }
      // 兜底：data URI → 原生 onDownloadStart 解码写入下载目录并提示
      const reader = new FileReader();
      reader.onload = () => fallbackDataUriDownload(reader.result, filename);
      reader.onerror = () => triggerBlobDownload(blob, filename);
      reader.readAsDataURL(blob);
      return;
    }
    triggerBlobDownload(blob, filename);
  }
  function readFile(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsText(file);
    });
  }
  global.fmt = { fmtDate, fmtRelative, fmtBytes, truncate, safeJSON, download, readFile };
})(window);
