/* MainActivity.java — Xvshuo 叙说 · Android WebView 壳
 * 加载 assets/www/index.html；内置下载监听（data URI → 系统下载目录 + Toast）
 */
package com.xvshuo.app;

import android.annotation.SuppressLint;
import android.app.DownloadManager;
import android.content.ContentValues;
import android.content.Context;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.View;
import android.webkit.DownloadListener;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {

  private WebView webView;

  @SuppressLint("SetJavaScriptEnabled")
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    webView = new WebView(this);
    setContentView(webView);

    WebSettings s = webView.getSettings();
    s.setJavaScriptEnabled(true);
    s.setDomStorageEnabled(true);
    s.setDatabaseEnabled(true);
    s.setAllowFileAccess(true);
    s.setAllowContentAccess(true);
    s.setMediaPlaybackRequiresUserGesture(false);
    s.setLoadWithOverviewMode(true);
    s.setUseWideViewPort(true);
    if (Build.VERSION.SDK_INT >= 21) {
      s.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW); // 允许 http API
    }
    // 注入原生标记（JS 侧通过 UA 检测，走 data URI 下载）
    String ua = s.getUserAgentString();
    if (!ua.contains("XvshuoNative")) {
      s.setUserAgentString(ua + " XvshuoNative");
    }

    webView.setWebViewClient(new WebViewClient() {
      @Override
      public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
        String url = request.getUrl().toString();
        if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("file://")) {
          return false; // 留在 WebView 内打开
        }
        return true;
      }

      @Override
      public void onPageStarted(WebView view, String url, Bitmap favicon) {
        super.onPageStarted(view, url, favicon);
      }
    });

    webView.setWebChromeClient(new WebChromeClient() {
      @Override
      public boolean onConsoleMessage(android.webkit.ConsoleMessage m) {
        return true; // 静默 console
      }
    });

    // 下载监听：data:（base64）解码写入系统下载目录；http(s) 走 DownloadManager
    webView.setDownloadListener(new DownloadListener() {
      @Override
      public void onDownloadStart(String url, String userAgent, String contentDisposition,
                                  String mimetype, long contentLength) {
        if (url.startsWith("data:")) {
          saveDataUri(url, filenameFrom(contentDisposition, url, "xvshuo-export"));
        } else if (url.startsWith("http://") || url.startsWith("https://")) {
          DownloadManager dm = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
          if (dm != null) {
            dm.enqueue(new DownloadManager.Request(Uri.parse(url))
                .setTitle(filenameFrom(contentDisposition, url, "xvshuo-export"))
                .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED));
          }
        } else {
          toast("暂不支持该下载链接");
        }
      }
    });

    // 离线优先：优先 file:///android_asset/www/index.html（打包时静态文件会拷入 assets/www）
    webView.loadUrl("file:///android_asset/www/index.html");
  }

  private String filenameFrom(String contentDisposition, String url, String fallback) {
    if (contentDisposition != null) {
      int i = contentDisposition.indexOf("filename=");
      if (i >= 0) {
        String name = contentDisposition.substring(i + 9).replace("\"", "").trim();
        if (!name.isEmpty()) return name;
      }
    }
    if (url.contains("/")) {
      String last = url.substring(url.lastIndexOf('/') + 1);
      if (last.length() > 0 && last.length() < 120 && !last.contains(",")) return last;
    }
    return fallback + "-" + System.currentTimeMillis();
  }

  private void saveDataUri(String url, String filename) {
    try {
      int comma = url.indexOf(',');
      if (comma < 0) { toast("下载失败：无效的数据链接"); return; }
      String meta = url.substring(5, comma); // data:xxx
      String payload = url.substring(comma + 1);
      boolean isBase64 = meta.contains(";base64");
      byte[] bytes = isBase64
          ? Base64.decode(payload, Base64.DEFAULT)
          : payload.getBytes(StandardCharsets.UTF_8);

      Uri outUri;
      if (Build.VERSION.SDK_INT >= 29) {
        ContentValues cv = new ContentValues();
        cv.put(MediaStore.Downloads.DISPLAY_NAME, filename);
        cv.put(MediaStore.Downloads.MIME_TYPE, mimeFrom(meta));
        cv.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
        outUri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, cv);
      } else {
        ContentValues cv = new ContentValues();
        cv.put(MediaStore.Downloads.DISPLAY_NAME, filename);
        cv.put(MediaStore.Downloads.MIME_TYPE, mimeFrom(meta));
        outUri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, cv);
      }
      if (outUri == null) { toast("下载失败：无法写入下载目录"); return; }
      try (OutputStream os = getContentResolver().openOutputStream(outUri)) {
        if (os != null) os.write(bytes);
      }
      toast("已保存到下载目录：" + filename);
    } catch (Exception e) {
      toast("下载失败：" + e.getMessage());
    }
  }

  private String mimeFrom(String dataMeta) {
    if (dataMeta == null) return "application/octet-stream";
    int semi = dataMeta.indexOf(';');
    String m = semi > 0 ? dataMeta.substring(0, semi) : dataMeta;
    return m.isEmpty() ? "application/octet-stream" : m;
  }

  private void toast(final String msg) {
    runOnUiThread(() -> Toast.makeText(MainActivity.this, msg, Toast.LENGTH_LONG).show());
  }

  @Override
  public void onBackPressed() {
    if (webView != null && webView.canGoBack()) {
      webView.goBack();
    } else {
      super.onBackPressed();
    }
  }

  @Override
  protected void onDestroy() {
    if (webView != null) webView.destroy();
    super.onDestroy();
  }
}
