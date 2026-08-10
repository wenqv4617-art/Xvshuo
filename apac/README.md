# Xvshuo 叙说 · APK 打包（apac/）

把网页应用打包成 Android APK 的轻量 WebView 壳工程。**与 Vercel 网页部署完全独立**（网页部署走根目录 `vercel.json`，与本目录无关）。

## 目录结构

```
apac/
├── app/
│   ├── build.gradle            # 应用模块（compileSdk 34 / minSdk 24）
│   └── src/main/
│       ├── AndroidManifest.xml
│       ├── assets/www/         # ← 静态站点（build-apk.sh 自动拷入，勿手改）
│       ├── java/com/xvshuo/app/MainActivity.java
│       └── res/                # 图标 / 主题 / 文案
├── build.gradle / settings.gradle / gradle.properties
└── README.md
```

## 如何打包 APK

> 沙箱/纯前端环境没有 Android SDK，无法直接产出 .apk 二进制。
> 本壳工程是完整可编译的，在装有 Android Studio 的机器上两步即可：

### 方式 A（推荐 · Android Studio）

1. 打开 Android Studio → `Open` → 选择本项目的 `apac/` 目录。
2. 等待 Gradle 同步完成（首次会自动下载依赖与 gradle wrapper）。
3. 运行 `bash scripts/build-apk.sh`（或直接点 AS 的 Run ▶ 装机调试）。

### 方式 B（命令行）

```bash
# 前置：JDK 17+、Android SDK（ANDROID_HOME 或 apac/local.properties 指向 SDK）
cd apac
gradle assembleDebug
# 输出：apac/app/build/outputs/apk/debug/app-debug.apk
```

安装：`adb install -r apac/app/build/outputs/apk/debug/app-debug.apk`

## APK 环境兼容说明

| 能力 | 实现 |
|------|------|
| 页面加载 | `file:///android_asset/www/index.html`（离线可用，不依赖网络） |
| 文件导出（JSON/TXT/DOCX） | JS 检测到壳注入的 `XvshuoNative` UA 标记后，把下载转为 **base64 data URI**；`MainActivity.onDownloadStart` 解码并写入**系统下载目录**，弹**原生 Toast**提示保存位置 |
| Toast / 弹窗提示 | 应用内全部为 DOM 卡片/Toast（无 window.alert 依赖），WebView 下天然可用 |
| 本地数据 | IndexedDB（Dexie）持久化，WebView 已开 DOM Storage 与数据库 |
| 网络 API | INTERNET 权限 + 明文流量允许（http/https 均可，DeepSeek/OpenAI 等） |
| 返回键 | 支持 WebView 内历史回退 |

> 若你改动过 `scripts/utils/format.js` 的下载逻辑，请保持 `isNativeApp()` 检测与 `data:` URI 触发方式，
> 以便原生下载监听能收到文件。

## 提示

- 换图标：替换 `app/src/main/res/drawable/ic_launcher_foreground.xml` 与背景色 `values/colors.xml`。
- 改应用名：`app/src/main/res/values/strings.xml` 的 `app_name`。
- 发布正式版：在 `app/build.gradle` 配置 signingConfig 后执行 `gradle assembleRelease`。
