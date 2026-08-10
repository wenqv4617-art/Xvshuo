# Xvshuo 叙说 · APK 打包（apac/）

把网页应用打包成 Android APK 的轻量 WebView 壳工程。**与 Vercel 网页部署完全独立**（网页部署走根目录 `vercel.json`，与本目录无关）。

## 目录结构

```
apac/
├── app/
│   ├── build.gradle            # 应用模块（compileSdk 34 / minSdk 24 / 固定签名支持）
│   └── src/main/
│       ├── AndroidManifest.xml
│       ├── assets/www/         # ← 静态站点（build-apk.sh 自动拷入，勿手改）
│       ├── java/com/xvshuo/app/MainActivity.java
│       └── res/                # 图标 / 主题 / 文案
├── build.gradle / settings.gradle / gradle.properties
└── README.md
```

## 一键：GitHub Actions 自动构建 APK（推荐）

仓库根目录已配置 `.github/workflows/build-apk.yml`。**每次 push 到 main 自动构建**：

1. 首次运行 `bash scripts/generate-keystore.sh` 生成 keystore 并 commit 入库（apac/keystore.jks + apac/keystore.properties）。**这一步只做一次**，之后所有构建共用同一签名 → 可覆盖安装。
2. `git push` 后进入仓库 **Actions** 标签页，等待 `Build Xvshuo APK` 运行完成。
3. 在运行结果页 **Artifacts** 下载 `xvshuo-apk`，解压得到 `app-release.apk`，直接安装即可。
   > 不是 tar 文件：工作流产物是 APK 本身（GitHub 用 zip 包裹，解压即 .apk）。
   > 若你的仓库此前有旧的 Pages 部署工作流（产物是 tar.gz），请删除它——网页部署已改走 Vercel。

## 固定签名（覆盖安装必需）

> 只有签名一致，新 APK 才能覆盖安装旧版本。keystore 入库一次，所有 CI 构建共用。

```bash
# 一次性生成并入库（在你自己的机器或沙箱里跑一次即可）
bash scripts/generate-keystore.sh
git add apac/keystore.jks apac/keystore.properties
git commit -m "chore: 入库固定签名 keystore"
git push
```

之后每次 push，Actions 都会用该 keystore 签名 → **签名一致 + versionCode 自动递增 → 可直接覆盖安装**。

> keystore.jks 已入库（不再走 .gitignore）。请同时备份到安全位置，丢失后无法再升级安装。
> 换签名需先卸载已安装版本。

## 本地构建

前置：JDK 17+、Android SDK（ANDROID_HOME 或 apac/local.properties 指向 SDK）。

```bash
bash scripts/build-apk.sh debug     # 调试包
bash scripts/build-apk.sh release   # 发布包（读取 keystore.properties 固定签名）
bash scripts/build-apk.sh sync      # 仅同步静态文件
```
输出：`apac/app/build/outputs/apk/{debug,release}/app-{debug,release}.apk`
安装：`adb install -r apac/app/build/outputs/apk/release/app-release.apk`

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
- 改版本号：`app/build.gradle` 的 `versionName`（versionCode 每次构建自动递增，无需手改）。
